angular.module('orderCloud')
    .controller('SpendingAccountCreateModalCtrl', SpendingAccountCreateModalController)
;

function SpendingAccountCreateModalController($uibModalInstance, OrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.spendingAccount = {};

    vm.submit = function() {
        vm.loading = OrderCloud.SpendingAccounts.Create(vm.spendingAccount, SelectedBuyerID)
            .then(function(newSpendingAccount) {
                $uibModalInstance.close(newSpendingAccount);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}