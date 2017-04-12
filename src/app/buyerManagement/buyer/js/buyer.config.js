angular.module('orderCloud')
    .config(BuyerConfig)
;

function BuyerConfig($stateProvider) {
    $stateProvider
        .state('buyer', {
            parent: 'base',
            url: '/buyers/:buyerid',
            templateUrl: 'buyerManagement/buyer/templates/buyer.html',
            controller: 'BuyerCtrl',
            controllerAs: 'buyer',
            data: {
                pageTitle: 'Buyer Settings'
            },
            resolve: {
                SelectedBuyer: function ($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Buyers.Get($stateParams.buyerid)
                        .then(function(buyer) {
                            if (!buyer.DefaultCatalogID) return buyer;
                            return OrderCloudSDK.Catalogs.Get(buyer.DefaultCatalogID)
                                .then(function(catalog) {
                                    buyer.SelectedDefaultCatalog = catalog;
                                    return buyer;
                                });
                        });
                }
            }
        });
}