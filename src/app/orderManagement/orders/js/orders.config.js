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
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
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