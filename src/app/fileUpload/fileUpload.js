angular.module('orderCloud')
    .factory('FileReader', fileReader)
    .directive('ocFileUpload', ordercloudFileUpload)
;

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

function ordercloudFileUpload($parse, FileReader, FilesService) {
    var directive = {
        scope: {
            model: '=',
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
        var el = element;
        scope.invalidExtension = false;

        scope.upload = function() {
            $('#orderCloudUpload').click();
        };

        scope.remove = function() {
            delete scope.model.xp.image.URL;
        };

        function afterSelection(file, fileName) {
            FilesService.Upload(file, fileName)
                .then(function(fileData) {
                    if (!scope.model.xp) scope.model.xp = {};
                    scope.model.xp.image = {};
                    scope.model.xp.image.URL = fileData.Location;
                });
        }

        var allowed = {
            Extensions: [],
            Types: []
        };
        if (scope.extensions) {
            var items = _.map(scope.extensions.split(','), function(ext) {
                return ext.replace(/ /g ,'').replace(/\./g, '').toLowerCase();
            });
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
                    if ((allowed.Extensions.length || allowed.Types.length) && fileName) {
                        var ext = fileName.split('.').pop().toLowerCase();
                        valid = (allowed.Extensions.indexOf(ext) != -1 || allowed.Types.indexOf(event.target.files[0].type.split('/')[0]) > -1);
                    }
                    if (valid) {
                        scope.$apply(function() {
                            FileReader.ReadAsDataUrl(event.target.files[0], scope)
                                .then(function() {
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
                            if (!scope.model.xp.image) scope.model.xp.image = {};
                            scope.model.xp.image.URL = null;
                        });
                    }
                    break;
            }
        }

        element.bind('change', updateModel);
    }

    return directive;
}

