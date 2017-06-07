angular.module('orderCloud')
    .directive('ocFileUpload', ordercloudFileUpload)
;

function ordercloudFileUpload($timeout, $uibModal, $ocFiles, OrderCloudSDK, ocFileReader, ocFilesService, ocConfirm) {
    var directive = {
        scope: {
            fileUploadModel: '=',
            fileUploadOptions: '='
        },
        restrict: 'E',
        require: '^?ocPrettySubmit',
        template: '<div ng-include="getTemplate()"></div>',
        replace: true,
        link: link
    };

    function link(scope, element, attrs, formCtrl) {
        if (!ocFilesService.Enabled()) return;
        if (!scope.fileUploadModel) 
            scope.fileUploadModel = {};
        if (!scope.fileUploadOptions.multiple) {
            if (!scope.fileUploadModel[scope.fileUploadOptions.keyname] || scope.fileUploadModel[scope.fileUploadOptions.keyname].constructor != Object) 
                scope.fileUploadModel[scope.fileUploadOptions.keyname] = {};
        }
        else {
            if (!scope.fileUploadModel[scope.fileUploadOptions.keyname] || !scope.fileUploadModel[scope.fileUploadOptions.keyname][scope.fileUploadOptions.arrayKeyName || 'Items'] || scope.fileUploadModel[scope.fileUploadOptions.keyname][scope.fileUploadOptions.arrayKeyName || 'Items'].constructor != Array) {
                scope.fileUploadModel[scope.fileUploadOptions.keyname] = {};
                scope.fileUploadModel[scope.fileUploadOptions.keyname][scope.fileUploadOptions.arrayKeyName || 'Items'] = [];
            }
        }

        scope.invalidExtension = false;

        if (!scope.fileUploadOptions) scope.fileUploadOptions = {};
        var globalOptions = $ocFiles.GetFileUploadOptions();
        scope.fileUploadOptions = {
            keyname: scope.fileUploadOptions.keyname || globalOptions.keyname || (scope.fileUploadOptions.multiple ? 'images' : 'image'),
            srcKeyname: scope.fileUploadOptions.srcKeyname || globalOptions.srcKeyname || 'URL',
            folder: scope.fileUploadOptions.folder || globalOptions.folder || null,
            extensions: scope.fileUploadOptions.extensions || globalOptions.extensions || null,
            invalidExtensions: scope.fileUploadOptions.invalidExtensions || globalOptions.invalidExtensions || null,
            uploadText: scope.fileUploadOptions.uploadText || globalOptions.uploadText || null,
            onUpdate: scope.fileUploadOptions.onUpdate || globalOptions.onUpdate || null,
            multiple: scope.fileUploadOptions.multiple || globalOptions.multiple || false,
            arrayKeyName: scope.fileUploadOptions.arrayKeyName || globalOptions.arrayKeyName || 'Items',
            addText: scope.fileUploadOptions.addText || globalOptions.addText || null,
            maxLimit: scope.fileUploadOptions.maxLimit || globalOptions.maxLimit || null,
            additionalFields: scope.fileUploadOptions.additionalFields || globalOptions.additionalFields || null,
            draggable: scope.fileUploadOptions.draggable || globalOptions.draggable || false,
            modal: scope.fileUploadOptions.modal || false
        };

        var multiple = scope.fileUploadOptions.multiple;

        scope.getTemplate = function() {
            return multiple ? 'common/directives/oc-file-upload/templates/oc-files-upload.html' : 'common/directives/oc-file-upload/templates/oc-file-upload.html';
        };

        scope.upload = function(index) {
            scope.fileUploadOptions.modal ? $('#orderCloudUpload').click() : openModal(multiple ? index : -2);
        };

        scope.urlChange = function() {
            if (!multiple) callOnUpdate();
        };

        function openModal(index) {
            $uibModal.open({
                templateUrl: 'common/directives/oc-file-upload/templates/oc-file-upload.modal.html',
                controller: 'FileUploadModalCtrl',
                controllerAs: 'fileUploadModal',
                resolve: {
                    Model: function() {
                        return scope.fileUploadModel;
                    },
                    SelectedIndex: function() {
                        return index;
                    },
                    FileUploadOptions: function() {
                        return scope.fileUploadOptions;
                    }
                }
            }).result.then(function(data) {
                scope.fileUploadModel = data;
                dirtyModel();
            }).catch(function(data) {
                scope.fileUploadModel = data;
            })
        }

        scope.addImage = function() {
            if (!multiple) return;
            openModal(-1);
        };

        scope.fileUploadModelCopy = angular.copy(scope.fileUploadModel);
        scope.dropped = function(index) {
            scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'][scope.fileUploadOptions.arrayKeyName || 'Items'].splice(index, 1);
            callOnUpdate();
            scope.fileUploadModelCopy = angular.copy(scope.fileUploadModel);
        };

        scope.removeFile = function(index) {
            ocConfirm.Confirm({
                message: 'Are you sure you want to delete this file?',
                confirmText: 'Delete file',
                type: 'delete'})
                .then(function() {
                    if (!multiple) {
                        scope.invalidExtension = false;
                        if (scope.fileUploadModel && scope.fileUploadModel[scope.fileUploadOptions.keyname || 'image']) scope.fileUploadModel[scope.fileUploadOptions.keyname || 'image'] = null;
                    }
                    else {
                        if (scope.fileUploadModel && scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'] && scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'][scope.fileUploadOptions.arrayKeyName || 'Items'] && scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'][scope.fileUploadOptions.arrayKeyName || 'Items'][index]) {
                            scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'][scope.fileUploadOptions.arrayKeyName || 'Items'].splice(index, 1);
                        }
                    }

                    callOnUpdate();
                    dirtyModel();
                });
        };

        function callOnUpdate() {
            if (scope.fileUploadOptions.onUpdate && (typeof scope.fileUploadOptions.onUpdate == 'function')) scope.fileUploadOptions.onUpdate(scope.fileUploadModel);
        }

        function dirtyModel() {
            if (formCtrl && formCtrl.setDirty) formCtrl.setDirty();
        }

        function afterSelection(file, folder, index) {
            ocFilesService.Upload(file, folder)
                .then(function(fileData) {
                    if (multiple) {
                        if (!scope.fileUploadModel) scope.fileUploadModel = {};
                        if (!scope.fileUploadModel[scope.fileUploadOptions.keyname]) scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'] = {Items: []};
                        scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'][scope.fileUploadOptions.arrayKeyName || 'Items'][index][scope.fileUploadOptions.srcKeyname || 'URL'] = fileData.Location;
                        scope.fileUploadModel[scope.fileUploadOptions.keyname || 'images'][scope.fileUploadOptions.arrayKeyName || 'Items'][index].Uploaded = true;
                    }
                    else {
                        if (!scope.fileUploadModel) scope.fileUploadModel = {};
                        scope.fileUploadModel[scope.fileUploadOptions.keyname || 'image'] = {};
                        scope.fileUploadModel[scope.fileUploadOptions.keyname || 'image'][scope.fileUploadOptions.srcKeyname || 'URL'] = fileData.Location;
                        scope.fileUploadModel[scope.fileUploadOptions.keyname || 'image'].Uploaded = true;
                    }

                    callOnUpdate();
                });
        }

        var allowed = {
            Extensions: [],
            Types: []
        };
        if (scope.fileUploadOptions.extensions) {
            var items = _.map(scope.fileUploadOptions.extensions.split(','), function(ext) {
                return ext.replace(/ /g, '').replace(/\./g, '').toLowerCase();
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

        var notAllowed = {
            Extensions: [],
            Types: []
        };
        if (scope.fileUploadOptions.invalidExtensions) {
            var items = _.map(scope.fileUploadOptions.invalidExtensions.split(','), function(ext) {
                return ext.replace(/ /g, '').replace(/\./g, '').toLowerCase();
            });
            angular.forEach(items, function(item) {
                if (item.indexOf('/') > -1) {
                    if (item.indexOf('*') > -1) {
                        notAllowed.Types.push(item.split('/')[0]);
                    }
                    else {
                        notAllowed.Extensions.push(item.split('/')[1]);
                    }
                }
                else {
                    notAllowed.Extensions.push(item);
                }
            });
        }

        function updateModel(event) {
            var index = multiple ? +(event.target.id.replace('orderCloudUpload', '')) : null;
            var targetType = event.target.name.replace(/[0-9]/g, '');
            switch (targetType) {
                case 'upload':
                    if (event.target.files[0] == null) return;
                    var fileName = event.target.files[0].name;
                    var valid = true;
                    if ((allowed.Extensions.length || allowed.Types.length) && fileName) {
                        var ext = fileName.split('.').pop().toLowerCase();
                        valid = (allowed.Extensions.indexOf(ext) != -1 || allowed.Types.indexOf(event.target.files[0].type.split('/')[0]) > -1);
                    }
                    if ((notAllowed.Extensions.length || notAllowed.Types.length) && fileName) {
                        var ext = fileName.split('.').pop().toLowerCase();
                        valid = (notAllowed.Extensions.indexOf(ext) == -1 && notAllowed.Types.indexOf(event.target.files[0].type.split('/')[0]) == -1);
                    }
                    if (valid) {
                        (multiple ? scope.fileUploadModel[scope.fileUploadOptions.keyname][scope.fileUploadOptions.arrayKeyName || 'Items'][index] : scope).invalidExtension = false;
                        scope.$apply(function() {
                            ocFileReader.ReadAsDataUrl(event.target.files[0], scope)
                                .then(function() {
                                    afterSelection(event.target.files[0], scope.fileUploadOptions.folder, index);
                                });
                        });
                    }
                    else {
                        scope.$apply(function() {
                            (multiple ? scope.fileUploadModel[scope.fileUploadOptions.keyname][scope.fileUploadOptions.arrayKeyName || 'Items'][index] : scope).invalidExtension = true;
                            var input;
                            event.target.files[0] = null;
                            if (multiple) {
                                angular.forEach(element.find('input'), function(fileInput) {
                                    if (fileInput.id == 'orderCloudUpload' + index) {
                                        fileInput.value = null;
                                        fileInput.replaceWith(input = angular.element(fileInput).clone(true)[0]);
                                    }
                                });
                            }
                            else {
                                element.find('input').replaceWith(input = element.find('input').clone(true));
                            }
                        });
                    }
                    break;
            }
        }

        angular.element(document).ready(filInputInit);

        function filInputInit() {
            if (!multiple) {
                $('#orderCloudUpload').bind('change', updateModel);
            }
            else {
                var inputCount = $('input[id*="orderCloudUpload"]').length;
                for (var i = 0; i < inputCount; i++) {
                    $('#orderCloudUpload' + i).bind('change', updateModel);
                }
            }
        }
    }

    return directive;
}

