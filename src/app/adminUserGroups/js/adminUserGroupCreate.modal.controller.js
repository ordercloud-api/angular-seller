angular.module('orderCloud')
    .controller('AdminUserGroupCreateModalCtrl', AdminUserGroupCreateModalController)
;

function AdminUserGroupCreateModalController($uibModalInstance, $exceptionHandler, sdkOrderCloud) {
    var vm = this;

    vm.submit = function() {
        vm.loading = sdkOrderCloud.AdminUserGroups.Create(vm.userGroup)
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