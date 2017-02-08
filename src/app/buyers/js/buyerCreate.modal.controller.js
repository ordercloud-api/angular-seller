angular.module('orderCloud')
    .controller('BuyerCreateModalCtrl', BuyerCreateModalController)
;

function BuyerCreateModalController($uibModalInstance, $exceptionHandler, OrderCloud) {
    var vm = this;
    vm.submit = submit;
    vm.cancel = cancel;
    vm.updateValidity = updateValidity;

    function updateValidity() {
        if (vm.form.ID.$error['Buyer.UnavailableID']) vm.form.ID.$setValidity('Buyer.UnavailableID', true);
    }

    function submit() {
        vm.loading = OrderCloud.Buyers.Create(vm.buyer)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                if (ex.status == 409) {
                    vm.form.ID.$setValidity('Buyer.UnavailableID', false);
                    vm.form.ID.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    }

    function cancel() {
        $uibModalInstance.dismiss();
    }
}