angular.module('orderCloud')
    .factory('ocBuyers', BuyersService)
;

function BuyersService($uibModal) {
    var service = {
        Create: _create
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'buyers/templates/buyerCreate.modal.html',
            controller: function($uibModalInstance, $exceptionHandler, OrderCloud) {
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
            },
            controllerAs: 'buyerCreateModal',
            bindToController: true
        }).result
    }

    return service;
}