angular.module('orderCloud')
    .config(ProductsConfig)
;

function ProductsConfig($stateProvider) {
    $stateProvider
        .state('products', {
            parent: 'base',
            templateUrl: 'productManagement/products/templates/products.html',
            controller: 'ProductsCtrl',
            controllerAs: 'products',
            url: '/products?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Products'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                ProductList: function(OrderCloud, Parameters) {
                    return OrderCloud.Products.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
    ;
}