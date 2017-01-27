angular.module('orderCloud')
    .controller('AdminUserEditModalCtrl', AdminUserEditModalController)
;


function AdminUserEditModalController($exceptionHandler, $uibModalInstance, OrderCloud) {
    var vm = this;

    vm.username = angular.copy(vm.user.Username);
    vm.fullName = vm.user.FirstName ? (vm.user.FirstName + (vm.user.LastName ? ' ' + vm.user.LastName : '')) : (vm.user.LastName ? vm.user.LastName : null);
    vm.userCopy = angular.copy(vm.user);

    if (vm.user.TermsAccepted != null) {
        vm.TermsAccepted = true;
    }

    vm.submit = function() {
        var today = new Date();
        vm.user.TermsAccepted = today;
        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.AdminUsers.Update(vm.user.ID, vm.userCopy)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.delete = function() {
        OrderCloud.AdminUsers.Delete(userid)
            .then(function() {
                $uibModalInstance.close();
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}
