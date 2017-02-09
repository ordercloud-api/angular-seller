angular.module('orderCloud')
    .config(BuyerConfig)
;

function BuyerConfig($stateProvider) {
    $stateProvider
        .state('buyer', {
            parent: 'base',
            url: '/buyers/:buyerid',
            templateUrl: 'buyers/buyer/templates/buyer.html',
            controller: 'BuyerCtrl',
            controllerAs: 'buyer',
            resolve: {
                SelectedBuyer: function ($stateParams, OrderCloud) {
                    return OrderCloud.Buyers.Get($stateParams.buyerid);
                }
            }
        })
}