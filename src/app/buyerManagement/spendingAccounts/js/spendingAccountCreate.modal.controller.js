angular.module('orderCloud')
    .controller('SpendingAccountCreateModalCtrl', SpendingAccountCreateModalController)
;

function SpendingAccountCreateModalController($uibModalInstance, OrderCloudSDK, SelectedBuyerID) {
    var vm = this;
    vm.spendingAccount = {};

    vm.submit = function() {
        vm.loading = OrderCloudSDK.SpendingAccounts.Create(SelectedBuyerID, vm.spendingAccount)
            .then(function(newSpendingAccount) {
                $uibModalInstance.close(newSpendingAccount);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}