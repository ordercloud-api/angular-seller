angular.module('orderCloud')
    .config(BuyerCatalogsConfig)
;

function BuyerCatalogsConfig($stateProvider) {
    $stateProvider
        .state('buyerCatalogs', {
            parent: 'buyer',
            url: '/catalogs?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/buyerCatalogs/templates/buyerCatalogs.html',
            controller: 'BuyerCatalogsCtrl',
            controllerAs: 'buyerCatalogs',
            data: {
                pageTitle: 'Buyer Catalogs'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CatalogList: function(Parameters, sdkOrderCloud) {
                    return sdkOrderCloud.Catalogs.List(Parameters);
                }
            }
        })
}