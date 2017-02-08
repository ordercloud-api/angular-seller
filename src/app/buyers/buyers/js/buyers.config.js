angular.module('orderCloud')
    .config(BuyersConfig)
;

function BuyersConfig($stateProvider) {
    $stateProvider
        .state('buyers', {
            parent: 'base',
            url: '/buyers?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'buyers/buyers/templates/buyers.html',
            controller: 'BuyersCtrl',
            controllerAs: 'buyers',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloud, Parameters) {
                    return OrderCloud.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize);
                }
            }
        })
}