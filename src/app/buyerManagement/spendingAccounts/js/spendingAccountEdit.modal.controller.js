angular.module('orderCloud')
    .controller('SpendingAccountEditModalCtrl', SpendingAccountEditModalController)
;

function SpendingAccountEditModalController($uibModalInstance, OrderCloud, SelectedSpendingAccount, SelectedBuyerID) {
    var vm = this;
    vm.spendingAccount = angular.copy(SelectedSpendingAccount);
    vm.spendingAccountName = SelectedSpendingAccount.Name;
    if (vm.spendingAccount.StartDate) vm.spendingAccount.StartDate = new Date(vm.spendingAccount.StartDate);
    if (vm.spendingAccount.EndDate) vm.spendingAccount.EndDate = new Date(vm.spendingAccount.EndDate);

    vm.submit = function() {
        vm.loading = OrderCloud.SpendingAccounts.Update(SelectedSpendingAccount.ID, vm.spendingAccount, SelectedBuyerID)
            .then(function(updatedSpendingAccount) {
                $uibModalInstance.close(updatedSpendingAccount);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}