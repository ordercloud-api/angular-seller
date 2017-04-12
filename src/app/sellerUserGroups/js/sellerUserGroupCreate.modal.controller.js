angular.module('orderCloud')
    .controller('SellerUserGroupCreateModalCtrl', SellerUserGroupCreateModalController)
;

function SellerUserGroupCreateModalController($uibModalInstance, $exceptionHandler, OrderCloudSDK) {
    var vm = this;

    vm.submit = function() {
        vm.loading = OrderCloudSDK.AdminUserGroups.Create(vm.userGroup)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}