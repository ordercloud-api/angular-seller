angular.module('orderCloud')
    .controller('BuyerCreateModalCtrl', BuyerCreateModalController)
;

function BuyerCreateModalController($uibModalInstance, $exceptionHandler, OrderCloud) {
    var vm = this;
    vm.submit = submit;
    vm.cancel = cancel;
    vm.updateValidity = updateValidity;

    function updateValidity() {
        if (vm.form.buyerIDinput.$error['Buyer.UnavailableID']) vm.form.buyerIDinput.$setValidity('Buyer.UnavailableID', true);
    }

    function submit() {
        vm.loading = OrderCloud.Buyers.Create(vm.buyer)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                if (ex.status == 409) {
                    vm.form.buyerIDinput.$setValidity('Buyer.UnavailableID', false);
                    vm.form.buyerIDinput.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    }

    function cancel() {
        $uibModalInstance.dismiss();
    }
}