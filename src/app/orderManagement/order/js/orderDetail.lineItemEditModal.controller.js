angular.module('orderCloud')
    .controller('OrderLineItemEditModalCtrl', OrderLineItemEditModalController)
;

function OrderLineItemEditModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, OrderID, LineItem, Product) {
    var vm = this;
    vm.lineItem = angular.copy(LineItem);
    vm.lineItemID = LineItem.ID;
    if (vm.lineItem.DateNeeded) vm.lineItem.DateNeeded = new Date(vm.lineItem.DateNeeded);
    vm.product = Product;

    vm.updateValidity = function() {
        if (vm.form.ID.$error['UnavailableID']) vm.form.ID.$setValidity('UnavailableID', true);
    };

    vm.submit = function() {
        var partial = _.pick(vm.lineItem, ['ID', 'Quantity', 'UnitPrice', 'DateNeeded']);
        if (partial.DateNeeded) partial.DateNeeded = new Date(partial.DateNeeded);
        vm.loading = OrderCloudSDK.LineItems.Patch('incoming', OrderID, LineItem.ID, partial)
            .then(function(data) {
                data.OriginalID = LineItem.ID;
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                if (ex.status == 409) {
                    vm.form.ID.$setValidity('UnavailableID', false);
                    vm.form.ID.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}