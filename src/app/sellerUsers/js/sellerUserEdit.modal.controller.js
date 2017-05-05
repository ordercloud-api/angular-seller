angular.module('orderCloud')
    .controller('SellerUserEditModalCtrl', SellerUserEditModalController)
;

function SellerUserEditModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, SelectedUser) {
    var vm = this;
    vm.user = angular.copy(SelectedUser);
    vm.selectedUser = SelectedUser;
    vm.username = SelectedUser.Username;
    vm.fullName = SelectedUser.FirstName ? (SelectedUser.FirstName + (SelectedUser.LastName ? ' ' + SelectedUser.LastName : '')) : (SelectedUser.LastName ? SelectedUser.LastName : null);

    if (vm.user.TermsAccepted != null) {
        vm.TermsAccepted = true;
    }

    vm.submit = function() {
        var today = new Date();
        vm.user.TermsAccepted = today;
        vm.loading = OrderCloudSDK.AdminUsers.Update(SelectedUser.ID, vm.user)
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
