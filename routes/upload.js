var router = require('express').Router();
var q = require('q');
var csv = require('csvtojson');
var _ = require('underscore');

router.route('/parse')
    .post(function(req, res) {
        parseFiles(req.body.Files)
            .then(function(data) {
                res.status(200).json({Data: data});
            })
            .catch(function(ex) {
                console.log('error');
                res.status(400).json({Error: ex});
            });
    })
;

function parseFiles(files) {
    var deferred = q.defer();
    var result = {};
    parseFile(files);

    function parseFile(files) {
        var first = true;
        var keyName = _.keys(files[0])[0];
        var file = files.shift()[keyName];

        csv({noheader: false, delimiter: '\t'})
            .fromString(file)
            .on('json', function(fileData) {
                if(first) {
                    result[keyName] = [];
                    first = false;
                }
                result[keyName].push(fileData);
            })
            .on('done', function(){
                if(!files.length) {
                    deferred.resolve(result);
                } else {
                    parseFile(files);
                }
            });
    }
    return deferred.promise;
}

module.exports = router;