angular.module('orderCloud')
    .controller('UserGroupCreateModalCtrl', UserGroupCreateModalController)
;

function UserGroupCreateModalController($uibModalInstance, $exceptionHandler, OrderCloud, SelectedBuyerID) {
    var vm = this;

    vm.submit = function() {
        vm.loading = sdkOrderCloud.UserGroups.Create(SelectedBuyerID, vm.userGroup)
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