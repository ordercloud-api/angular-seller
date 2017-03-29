angular.module('orderCloud')
    .controller('OrderCtrl', OrderController)
;

function OrderController($stateParams, toastr, sdkOrderCloud, ocOrderDetailService, SelectedOrder, OrderLineItems) {
    var vm = this;
    vm.order = SelectedOrder;
    vm.lineItems = OrderLineItems;

    vm.pageChanged = function() {
        var options = {
            page: vm.lineItems.Meta.Page,
            pageSize: vm.lineItems.Meta.PageSize
        };
        sdkOrderCloud.LineItems.List('incoming', $stateParams.orderid, options)
            .then(function(data) {
                vm.lineItems = data;
            });
    };

    vm.loadMore = function() {
        var options = {
            page: vm.lineItems.Meta.Page++,
            pageSize: vm.lineItems.Meta.PageSize
        }
        sdkOrderCloud.LineItems.List('incoming', $stateParams.orderid, options)
            .then(function(data) {
                vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                vm.lineItem.Meta = data.Meta;
            });
    };

    vm.editLineItem = function(lineItem) {
        ocOrderDetailService.EditLineItem(vm.order.FromCompanyID, vm.order.ID, lineItem)
            .then(function(data) {
                var itemIndex = 0;
                angular.forEach(vm.lineItems.Items, function(item, index) {
                    if (item.ID == data.OriginalID) {
                        itemIndex = index;
                    }
                });
                vm.lineItems.Items[itemIndex] = data;
                sdkOrderCloud.Orders.Get('incoming', $stateParams.orderid)
                    .then(function(orderData) {
                        vm.order = angular.extend(vm.order, _.pick(orderData, ['Subtotal', 'TaxCost', 'ShippingCost', 'Total']));
                        toastr.success('Line item updated.');
                    });
            });
    };
}