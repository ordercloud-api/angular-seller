angular.module('orderCloud')
    .config(BuyerConfig)
;

function BuyerConfig($stateProvider) {
    $stateProvider
        .state('buyers', {
            parent: 'base',
            controller: 'BuyersCtrl',
            controllerAs: 'buyers',
            templateUrl: 'buyers/templates/buyers.html',
            url: '/buyers?search&page&pageSize',
            resolve : {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloud, Parameters) {
                    return OrderCloud.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize || 12/*, Parameters.searchOn, Parameters.sortBy, Parameters.filters*/);
                    //Commenting out params that don't exist yet in the API
                }
            }
        })
        .state('buyer', {
            parent: 'base',
            url: '/buyers/:buyerid',
            templateUrl: 'buyers/templates/buyer.html',
            controller: 'BuyerCtrl',
            controllerAs: 'buyer',
            resolve: {
                SelectedBuyer: function ($stateParams, OrderCloud) {
                    return OrderCloud.Buyers.Get($stateParams.buyerid);
                }
            }
        })
        .state('buyer.settings', {
            url: '/settings',
            templateUrl: 'buyers/templates/buyerSettings.html'
        })
}