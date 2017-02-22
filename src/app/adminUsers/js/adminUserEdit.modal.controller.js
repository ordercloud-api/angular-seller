angular.module('orderCloud')
    .controller('AdminUserEditModalCtrl', AdminUserEditModalController)
;

function AdminUserEditModalController($exceptionHandler, $uibModalInstance, OrderCloud, SelectedUser) {
    var vm = this;
    vm.user = angular.copy(SelectedUser);
    vm.username = SelectedUser.Username;
    vm.fullName = SelectedUser.FirstName ? (SelectedUser.FirstName + (SelectedUser.LastName ? ' ' + SelectedUser.LastName : '')) : (SelectedUser.LastName ? SelectedUser.LastName : null);

    if (vm.user.TermsAccepted != null) {
        vm.TermsAccepted = true;
    }

    vm.submit = function() {
        var today = new Date();
        vm.user.TermsAccepted = today;
        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.AdminUsers.Update(vm.user.ID, vm.user)
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
