angular.module('orderCloud')
    .factory('FileReader1', fileReader)
    .factory('FilesService1', FilesService)
    .directive('ocFileUpload', ordercloudFileUpload)
;

//TODO: update the New SDK to have a file Upload method similar to how this works.  Minus attaching the file info to any XP
function fileReader($q) {
    var service = {
        ReadAsDataUrl: _readAsDataURL
    };

    function onLoad(reader, deferred, scope) {
        return function() {
            scope.$apply(function() {
                deferred.resolve(reader);
            });
        };
    }

    function onError(reader, deferred, scope) {
        return function() {
            scope.$apply(function() {
                deferred.reject(reader);
            });
        };
    }

    function onProgress(reader, scope) {
        return function(event) {
            scope.$broadcast('fileProgress',
                {
                    total: event.total,
                    loaded: event.loaded
                });
        };
    }

    function getReader(deferred, scope) {
        var reader = new FileReader();
        reader.onload = onLoad(reader, deferred, scope);
        reader.onerror = onError(reader, deferred, scope);
        reader.onprogress = onProgress(reader, scope);
        return reader;
    }

    function _readAsDataURL(file, scope) {
        var deferred = $q.defer();

        var reader = getReader(deferred, scope);
        reader.readAsDataURL(file);

        return deferred.promise;
    }

    return service;
}

// function FilesService($q, $http, OrderCloud, apiurl) {
//     var service = {
//         Upload: _upload
//     };
//
//     var fileURL = apiurl + '/v1/files';
//
//     function _upload(file, fileName) {
//         var deferred = $q.defer();
//
//         var fd = new FormData();
//         fd.append('file', file);
//
//         $http.post(fileURL + '?filename=' + fileName, fd, {transformRequest: angular.identity, headers: {'Content-Type': undefined, 'Authorization': 'Bearer ' + OrderCloud.Auth.ReadToken()}})
//             .success(function(data) {
//                 deferred.resolve(data);
//             })
//             .error(function(error) {
//                 deferred.reject(error)
//             });
//
//         return deferred.promise;
//     }
//
//     return service;
// }
function FilesService($q) {
    var service = {
        Get: _get,
        Upload: _upload,
        Delete: _delete
    };

    AWS.config.region = 'us-east-1';
    AWS.config.update({ accessKeyId: 'AKIAJDDM5ZWWOIH4AZZQ', secretAccessKey: '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' });

    function randomString() {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var string_length = 15;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring;
    }

    function _get(fileKey) {
        var deferred = $q.defer();
        var s3 = new AWS.S3();
        var params = {Bucket: 'marketplace-application-test', Key: fileKey};
        s3.getObject(params, function (err, data) {
            err ? console.log(err) : console.log(data);
            deferred.resolve(data);
        });
        return deferred.promise;
    }

    function _upload(file) {
        var deferred = $q.defer();
        var s3 = new AWS.S3();
        var params = {Bucket: 'marketplace-application-test', Key: randomString(), ContentType: file.type, Body: file};
        s3.upload(params, function (err, data) {
            err ? console.log(err) : console.log(data);
            deferred.resolve(data);
        });
        return deferred.promise;
    }

    function _delete(fileKey) {
        var deferred = $q.defer();
        var s3 = new AWS.S3();
        var params = {Bucket: 'marketplace-application-test', Key: fileKey};
        s3.deleteObject(params, function (err, data) {
            err ? console.log(err) : console.log(data);
            deferred.resolve(data);
        });
        return deferred.promise;
    }

    return service;
}


function ordercloudFileUpload($parse, FileReader1, FilesService1) {
    var directive = {
        scope: {
            model: '=',
            keyname: '@',
            label: '@',
            extensions: '@',
            invalidExtension: '@'
        },
        restrict: 'E',
        templateUrl: 'fileUpload/templates/fileUpload.tpl.html',
        replace: true,
        link: link
    };

    function link(scope, element, attrs) {
        var file_input = $parse('file');
        var file_control = angular.element(element.find('input'))[0];
        var el = element;
        scope.invalidExtension = false;

        scope.upload = function() {
            $('#orderCloudUpload').click();
        };

        scope.remove = function() {
            delete scope.model.xp[scope.keyname];
        };

        function afterSelection(file, fileName) {
            FilesService1.Upload(file, fileName)
                .then(function(fileData) {
                    if (!scope.model.xp) scope.model.xp = {};
                    scope.model.xp.image = {};
                    scope.model.xp.s3 = fileData;
                    scope.model.xp.image.URL = fileData.Location;
                });
        }

        var allowed = {
            Extensions: [],
            Types: []
        };
        if (scope.extensions) {
            var items = Underscore.map(scope.extensions.split(','), function(ext) { return ext.replace(/ /g ,'').replace(/\./g, '').toLowerCase() });
            angular.forEach(items, function(item) {
                if (item.indexOf('/') > -1) {
                    if (item.indexOf('*') > -1) {
                        allowed.Types.push(item.split('/')[0]);
                    }
                    else {
                        allowed.Extensions.push(item.split('/')[1]);
                    }
                }
                else {
                    allowed.Extensions.push(item);
                }
            });
        }

        function updateModel(event) {
            switch (event.target.name) {
                case 'upload':
                    if (event.target.files[0] == null) return;
                    var fileName = event.target.files[0].name;
                    var valid = true;
                    // if ((allowed.Extensions.length || allowed.Types.length) && fileName) {
                    //     var ext = fileName.split('.').pop().toLowerCase();
                    //     valid = (allowed.Extensions.indexOf(ext) != -1 || allowed.Types.indexOf(event.target.files[0].type.split('/')[0]) > -1);
                    // }
                    if (valid) {
                        scope.$apply(function() {
                            FileReader1.ReadAsDataUrl(event.target.files[0], scope)
                                .then(function(f) {
                                    afterSelection(event.target.files[0], fileName);
                                });
                            file_input.assign(scope, event.target.files[0]);
                        });
                    }
                    else {
                        scope.$apply(function() {
                            scope.invalidExtension = true;
                            var input;
                            event.target.files[0] = null;
                            el.find('input').replaceWith(input = el.find('input').clone(true));
                            if (!scope.model.xp) scope.model.xp = {};
                            scope.model.xp[scope.keyname] = null;
                        });
                    }
                    break;
            }
        }

        element.bind('change', updateModel);
    }

    return directive;
}

