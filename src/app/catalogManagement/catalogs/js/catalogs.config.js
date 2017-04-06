angular.module('orderCloud')
    .config(CatalogsConfig)
;

function CatalogsConfig($stateProvider) {
    $stateProvider
        .state('catalogs', {
            parent: 'base',
            url: '/catalogs?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/catalogs/templates/catalogs.html',
            controller: 'CatalogsCtrl',
            controllerAs: 'catalogs',
            data: {
                pageTitle: 'Catalog Management'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CatalogList: function(Parameters, OrderCloudSDK) {
                    return OrderCloudSDK.Catalogs.List(Parameters);
                }
            }
        });
}