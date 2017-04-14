angular.module('orderCloud')
    .controller('OrderCtrl', OrderController)
;

function OrderController($stateParams, toastr, OrderCloudSDK, ocOrderDetailService, SelectedOrder, OrderLineItems) {
    var vm = this;
    vm.order = SelectedOrder;
    vm.lineItems = OrderLineItems;

    vm.navigationItems = [{
            icon: 'fa-file',
            state: 'orderDetail',
            name: 'Details'
        },
        {
            icon: 'fa-dollar',
            state: 'orderDetail.payments',
            name: 'Payments'
        },
        {
            icon: 'fa-truck',
            state: 'orderDetail.shipments',
            name: 'Shipments',
            activeWhen: ['orderDetail.shipments', 'orderDetail.shipments.create']
        },
        {
            icon: 'fa-check-square-o',
            state: 'orderDetail.approvals',
            name: 'Approvals'
        }
    ];

    vm.pageChanged = function() {
        var options = {
            page: vm.lineItems.Meta.Page,
            pageSize: vm.lineItems.Meta.PageSize
        };
        OrderCloudSDK.LineItems.List('incoming', $stateParams.orderid, options)
            .then(function(data) {
                vm.lineItems = data;
            });
    };

    vm.loadMore = function() {
        var options = {
            page: vm.lineItems.Meta.Page++,
            pageSize: vm.lineItems.Meta.PageSize
        };
        OrderCloudSDK.LineItems.List('incoming', $stateParams.orderid, options)
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
                OrderCloudSDK.Orders.Get('incoming', $stateParams.orderid)
                    .then(function(orderData) {
                        vm.order = angular.extend(vm.order, _.pick(orderData, ['Subtotal', 'TaxCost', 'ShippingCost', 'Total']));
                        toastr.success('Line item updated.');
                    });
            });
    };
}