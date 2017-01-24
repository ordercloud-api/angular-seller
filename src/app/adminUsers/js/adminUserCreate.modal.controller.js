angular.module('orderCloud')
    .controller('AdminUserCreateModalCtrl', AdminUserCreateModalController)
;

function AdminUserCreateModalController($exceptionHandler, $uibModalInstance, $state, toastr, OrderCloud) {
    var vm = this;
    vm.user = {Email: '', Password: '', Active: false};

    vm.submit = function() {
        vm.user.TermsAccepted = new Date();

        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.AdminUsers.Create(vm.user)
            .then(function(data) {
                $uibModalInstance.close(data);
                toastr.success('User Created', 'Success');
                $state.go('users', {}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}