angular.module('orderCloud')
    .controller('CreditCardCreateModalCtrl', CreditCardCreateModalController)
;

function CreditCardCreateModalController($uibModalInstance, ocAuthNet, ocCreditCardUtility, SelectedBuyerID) {
    var vm = this;
    vm.creditCardInfo = ocCreditCardUtility;

    vm.submit = function() {
        vm.creditCard.Shared = true;
        vm.loading = ocAuthNet.CreateCreditCard(vm.creditCard, SelectedBuyerID)
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