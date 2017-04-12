angular.module('orderCloud')
    .controller('SellerUserCreateModalCtrl', SellerUserCreateModalController)
;

function SellerUserCreateModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK) {
    var vm = this;
    vm.user = {Active: false};

    vm.submit = function() {
        vm.user.TermsAccepted = new Date();
        vm.loading = OrderCloudSDK.AdminUsers.Create(vm.user)
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