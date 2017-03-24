angular.module('orderCloud')
    .factory('UploadService', UploadService)
;

function UploadService($q, $resource, devapiurl) {
    var service = {
        Parse: _parse,
        ReadFiles: _readFiles,
        BuildXpObj: _buildXpObj,
        IsValid: _isValid,
        IsNumber: _isNumber
    };

    function _parse(files) {
        return _readFiles(files)
            .then(function(fileData) {
                return $resource(devapiurl + '/upload/parse', {}, {parse: {method: 'POST'}}).parse({Files: fileData}).$promise
                    .then(function(data) {
                        if(data.Data.UserFile) {
                            var userQueue = [];
                            var users = data.Data.UserFile;
                            var uniqueUserObjs = _.groupBy(users, 'id');
                            _.each(uniqueUserObjs, function(userArr){
                                if(userArr.length > 0) {
                                    userArr[0].store_location_id = _.pluck(userArr, 'store_location_id');
                                    userQueue.push(userArr[0]);
                                }
                            });
                            data.Data.UserFile = userQueue;
                        } else {
                            return data.Data;
                        }
                        return data.Data;
                    });
            });
    }

    function _readFiles(files) {
        var results = angular.copy(files);
        var deferred = $q.defer();

        if(files.length) {
            readFile(0);
        } else {
            deferred.reject('There are no files');
        }

        return deferred.promise;

        function readFile(index) {
            var key = _.keys(results[index])[0];
            var reader = new FileReader();
            var file = files[index][key].target.files;

            reader.onload = function(e) {
                var data = e.target.result;
                results[index][key] = data;

                if(index === files.length - 1) {
                    deferred.resolve(results);
                } else {
                    readFile(index + 1);
                }
            };
            reader.readAsText(file[0]);
        }
    }

    function _buildXpObj(object, mapping){
        var result = {};
        var xpKeyPaths = [];

        //get all xp keyPaths that have a value, ex: xp.image.URL
        _.each(mapping, function(value, key){
            var isXP = key.indexOf('xp') > -1;
            if(isXP && object[mapping[key]]) xpKeyPaths.push(key);
        });

        //build up xp obj then set xp value
        _.each(xpKeyPaths, function(path){
            var keys = path.split('.'); //[xp, image, URL]
            _.reduce(keys, function(node, value){
                return node[value] || (node[value] = {});
            }, result);

            setXPValue(result, keys, object[mapping[path]]);
        });

        return result.xp || null;

        function setXPValue(result, keys, value){
            if(keys.length > 1){
                setXPValue(result[keys.shift()], keys, value);
            } else{
                result[keys[0]] = value;
            }
        }
    }

    function _isValid(str) {
        return !/[~`!#$%\^&*+=\\[\]\\';.,/{}|\\":<>\?]/g.test(str);
    }


    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    return service;
}