angular.module('orderCloud')
    .config(OrdersConfig)
;

function OrdersConfig($stateProvider) {
    $stateProvider
        .state('orders', {
            parent: 'base',
            url: '/orders?buyerID&fromDate&toDate&search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'orderManagement/orders/templates/orders.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders',
            data: {
                pageTitle: 'Orders'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                OrderList: function(ocOrdersService, OrderCloud, Parameters) {
                    return ocOrdersService.List(Parameters);
                },
                BuyerCompanies: function(OrderCloud) {
                    return OrderCloud.Buyers.List(null, 1, 100);
                }
            }
        })
    ;
}