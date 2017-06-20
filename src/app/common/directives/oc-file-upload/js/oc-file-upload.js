angular.module('orderCloud')
    .directive('ocFileUpload', ordercloudFileUpload)
;

function ordercloudFileUpload($uibModal, $ocFiles, ocFiles, ocConfirm) {
    var directive = {
        scope: {
            model: '<fileUploadModel',
            options: '<fileUploadOptions'
        },
        restrict: 'E',
        require: '^?ocPrettySubmit',
        template: '<div ng-include="fileUploadTemplate"></div>',
        replace: true,
        link: link
    };

    function link(scope, element, attrs, formCtrl) {
        if (!ocFiles.Enabled()) return;
        (function mergeOptions() {
            var globalOptions = $ocFiles.GetFileUploadOptions();
            scope.fileUploadOptions = scope.options ?  _.merge({}, globalOptions, scope.options) : globalOptions;
            scope.fileUploadTemplate = scope.fileUploadOptions.multiple ? 'common/directives/oc-file-upload/templates/oc-files-upload.html' : 'common/directives/oc-file-upload/templates/oc-file-upload.html';
            initModelValue();
        })();

        function initModelValue() {
            if (scope.fileUploadModel) scope.model = scope.fileUploadModel;
            scope.model ? scope.fileUploadModel = angular.copy(scope.model) : scope.fileUploadModel = {};
            var modelKeynameConstructor = scope.fileUploadModel[scope.fileUploadOptions.keyname] ? scope.fileUploadModel[scope.fileUploadOptions.keyname].constructor : undefined;

            if (scope.fileUploadOptions.multiple && modelKeynameConstructor !== Array) {
                scope.fileUploadModel[scope.fileUploadOptions.keyname] = [];
            } else if (!scope.fileUploadOptions.multiple && modelKeynameConstructor !== Object) {
                scope.fileUploadModel[scope.fileUploadOptions.keyname] = {};
            }
        }

        scope.openModal = function(index) {
            $uibModal.open({
                templateUrl: 'common/directives/oc-file-upload/templates/oc-file-upload.modal.html',
                controller: 'FileUploadModalCtrl',
                controllerAs: 'fileUploadModal',
                resolve: {
                    CurrentValue: function() {
                        return scope.fileUploadOptions.multiple ? (index > -1 ? scope.fileUploadModel[scope.fileUploadOptions.keyname][index] : {}) : scope.fileUploadModel[scope.fileUploadOptions.keyname];
                    },
                    FileUploadOptions: function() {
                        return scope.fileUploadOptions;
                    }
                }
            }).result.then(function(data) {
                if (scope.fileUploadOptions.multiple) {
                    index > -1 
                        ? (scope.fileUploadModel[index] = data) 
                        : scope.fileUploadModel[scope.fileUploadOptions.keyname] ? scope.fileUploadModel[scope.fileUploadOptions.keyname].push(data) : scope.fileUploadModel[scope.fileUploadOptions.keyname] = [data];
                } else {
                    scope.fileUploadModel[scope.fileUploadOptions.keyname] = data;
                }
                callOnUpdate();
                dirtyModel();
            });
        };

        scope.addImage = function() {
            if (!scope.fileUploadOptions.multiple) return;
            scope.openModal(-1);
        };

        scope.fileUploadModelCopy = angular.copy(scope.fileUploadModel);
        scope.dropped = function(index) {
            scope.fileUploadModel[scope.fileUploadOptions.keyname].splice(index, 1);
            callOnUpdate();
            scope.fileUploadModelCopy = angular.copy(scope.fileUploadModel);
        };

        scope.removeFile = function(index) {
            ocConfirm.Confirm({
                message: 'Are you sure you want to delete this file?',
                confirmText: 'Delete file',
                type: 'delete'})
                .then(function() {
                    if (scope.fileUploadOptions.multiple) {
                        if (scope.fileUploadModel && scope.fileUploadModel[scope.fileUploadOptions.keyname] && scope.fileUploadModel[scope.fileUploadOptions.keyname] && scope.fileUploadModel[scope.fileUploadOptions.keyname][index]) {
                            scope.fileUploadModel[scope.fileUploadOptions.keyname].splice(index, 1);
                        }
                    }
                    else {
                        if (scope.fileUploadModel && scope.fileUploadModel[scope.fileUploadOptions.keyname]) scope.fileUploadModel[scope.fileUploadOptions.keyname] = null;
                    }

                    callOnUpdate();
                    dirtyModel();
                });
        };

        function callOnUpdate() {
            if (scope.fileUploadOptions.onUpdate && (typeof scope.fileUploadOptions.onUpdate == 'function')) scope.fileUploadOptions.onUpdate(scope.fileUploadModel);
            initModelValue();

        }

        function dirtyModel() {
            if (formCtrl && formCtrl.setDirty) formCtrl.setDirty();
        }
    }

    return directive;
}

