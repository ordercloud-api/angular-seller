angular.module('orderCloud')
    .config(OrderConfig)
;

function OrderConfig($stateProvider) {
    $stateProvider
        .state('orderDetail', {
            parent: 'base',
            url: '/order/:buyerid/:orderid',
            templateUrl: 'orderManagement/order/templates/orderDetail.html',
            controller: 'OrderCtrl',
            controllerAs: 'orderDetail',
            data: {
                pageTitle: 'Order'
            },
            resolve: {
                SelectedOrder: function($stateParams, ocOrderDetailService) {
                    return ocOrderDetailService.GetOrderDetails($stateParams.orderid);
                },
                OrderLineItems: function($stateParams, sdkOrderCloud) {
                    var options = {
                        page: 1
                    };
                    return sdkOrderCloud.LineItems.List('incoming', $stateParams.orderid, options);
                }
            }
        })
    ;
}