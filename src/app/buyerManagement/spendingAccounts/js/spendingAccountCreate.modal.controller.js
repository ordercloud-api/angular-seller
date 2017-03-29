angular.module('orderCloud')
    .controller('SpendingAccountCreateModalCtrl', SpendingAccountCreateModalController)
;

function SpendingAccountCreateModalController($uibModalInstance, sdkOrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.spendingAccount = {};

    vm.submit = function() {
        vm.loading = sdkOrderCloud.SpendingAccounts.Create(SelectedBuyerID, vm.spendingAccount)
            .then(function(newSpendingAccount) {
                $uibModalInstance.close(newSpendingAccount);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}