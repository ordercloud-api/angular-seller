angular.module('orderCloud')
    .controller('CreditCardEditModalCtrl', CreditCardEditModalController)
;

function CreditCardEditModalController($uibModalInstance, $filter, ocAuthNet, ocCreditCardUtility, SelectedCreditCard, SelectedBuyerID) {
    var vm = this;
    vm.creditCard = angular.copy(SelectedCreditCard);
    vm.creditCard.UpdatedCreditCardID = angular.copy(SelectedCreditCard.ID);
    vm.creditCardInfo = ocCreditCardUtility;
    vm.creditCard.ExpirationMonth = $filter('date')(vm.creditCard.ExpirationDate, 'MM');
    vm.creditCard.ExpirationYear = +($filter('date')(vm.creditCard.ExpirationDate, 'yyyy'));
    if (vm.creditCardInfo.ExpirationYears.indexOf(vm.creditCard.ExpirationYear) == -1) vm.creditCardInfo.ExpirationYears.unshift(vm.creditCard.ExpirationYear);

    vm.submit = function() {
        vm.creditCard.Shared = true;
        vm.creditCard.CardNumber = vm.creditCard.PartialAccountNumber;
        vm.loading = ocAuthNet.UpdateCreditCard(vm.creditCard, SelectedBuyerID)
            .then(function(creditCard) {
                $uibModalInstance.close(creditCard);
            })
            .catch(function(ex) {
                $uibModalInstance.dismiss(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}