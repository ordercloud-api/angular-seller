angular.module('orderCloud')
    .config(OrderConfig)
;

function OrderConfig($stateProvider) {
    $stateProvider
        .state('order', {
            parent: 'base',
            url: '/order/:buyerid/:orderid',
            templateUrl: 'orderManagement/order/templates/order.html',
            controller: 'OrderCtrl',
            controllerAs: 'order',
            resolve: {
                SelectedOrder: function($stateParams, OrderCloud) {
                    return OrderCloud.Orders.Get($stateParams.orderid, $stateParams.buyerid);
                }
            }
        })
    ;
}