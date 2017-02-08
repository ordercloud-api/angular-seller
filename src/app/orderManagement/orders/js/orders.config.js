angular.module('orderCloud')
    .config(OrdersConfig)
;

function OrdersConfig($stateProvider) {
    $stateProvider
        .state('orders', {
            parent: 'base',
            url: '/orders?buyerID&from&to&search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'orderManagement/orders/templates/orders.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                OrderList: function(OrderCloud, Parameters) {
                    return OrderCloud.Orders.ListIncoming(Parameters.from, Parameters.to, Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerID);
                }
            }
        })
    ;
}