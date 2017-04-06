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
                OrderLineItems: function($stateParams, OrderCloudSDK) {
                    var options = {
                        page: 1
                    };
                    return OrderCloudSDK.LineItems.List('incoming', $stateParams.orderid, options);
                }
            }
        })
    ;
}