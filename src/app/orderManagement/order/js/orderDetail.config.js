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
                    //return OrderCloud.Orders.Get($stateParams.orderid, $stateParams.buyerid);
                    return ocOrderDetailService.GetOrderDetails($stateParams.orderid, $stateParams.buyerid);
                },
                OrderLineItems: function($stateParams, OrderCloud) {
                    return OrderCloud.LineItems.List($stateParams.orderid, null, 1, null, null, null, null, $stateParams.buyerid);
                }
            }
        })
    ;
}