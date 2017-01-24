angular.module('orderCloud')
    .factory('ocConfirm', OrderCloudConfirmService)
    .controller('ConfirmModalCtrl', ConfirmModalController)
;

function OrderCloudConfirmService($uibModal) {
    var service = {
        Confirm: _confirm
    };

    function _confirm(options) {
        return $uibModal.open({
            animation:false,
            backdrop:'static',
            templateUrl: 'common/templates/confirm.modal.html',
            controller: 'ConfirmModalCtrl',
            controllerAs: 'confirmModal',
            size: 'sm',
            resolve: {
                ConfirmOptions: function() {
                    return options;
                }
            }
        }).result
    }

    return service;
}

function ConfirmModalController($uibModalInstance, ConfirmOptions) {
    var vm = this;
    vm.message = ConfirmOptions.message;
    vm.confirmText = ConfirmOptions.confirmText;
    vm.cancelText = ConfirmOptions.cancelText;

    vm.confirm = function() {
        $uibModalInstance.close();
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}