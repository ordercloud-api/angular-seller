angular.module('orderCloud')
    .directive('ocFileUpload', ordercloudFileUpload)
;

function ordercloudFileUpload($uibModal, $ocFiles, ocFiles, ocConfirm) {
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
        if (!ocFiles.Enabled()) return;
        (function mergeOptions() {
            var globalOptions = $ocFiles.GetFileUploadOptions();
            scope.fileUploadOptions = angular.extend(globalOptions, scope.fileUploadOptions || {});
            initModelValue();
        })();

        function initModelValue() {
            if (!scope.fileUploadOptions.multiple) {
                if (!scope.fileUploadModel[scope.fileUploadOptions.keyname] || scope.fileUploadModel[scope.fileUploadOptions.keyname].constructor !== Object) 
                    scope.fileUploadModel[scope.fileUploadOptions.keyname] = {};
            }
            else {
                if (!scope.fileUploadModel[scope.fileUploadOptions.keyname] || scope.fileUploadModel[scope.fileUploadOptions.keyname].constructor !== Array) {
                    scope.fileUploadModel[scope.fileUploadOptions.keyname] = [];
                }
            }
        }

        scope.getTemplate = function() {
            return scope.fileUploadOptions.multiple ? 'common/directives/oc-file-upload/templates/oc-files-upload.html' : 'common/directives/oc-file-upload/templates/oc-file-upload.html';
        };

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
                    index > -1 ? (scope.fileUploadModel[index] = data) : scope.fileUploadModel[scope.fileUploadOptions.keyname].push(data);
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

