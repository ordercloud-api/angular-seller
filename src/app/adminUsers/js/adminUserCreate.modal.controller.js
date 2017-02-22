angular.module('orderCloud')
    .controller('AdminUserCreateModalCtrl', AdminUserCreateModalController)
;

function AdminUserCreateModalController($exceptionHandler, $uibModalInstance, OrderCloud) {
    var vm = this;
    vm.user = {Active: false};

    vm.submit = function() {
        vm.user.TermsAccepted = new Date();

        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.AdminUsers.Create(vm.user)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}