angular.module('orderCloud')
    .config(RelatedProductConfig)
;

function RelatedProductConfig($stateProvider) {
    $stateProvider
        .state('product.relatedProducts', {
            url: '/related-products?search&page&pageSize&searchOn&sortBy',
            templateUrl: 'productManagement/relatedProducts/templates/relatedProducts.html',
            controller: 'RelatedProductsCtrl',
            controllerAs: 'relatedProducts',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                ProductList: function(SelectedProduct, Parameters, ocRelatedProducts) {
                    return ocRelatedProducts.List(SelectedProduct, Parameters);
                }
            }
        })
    ;
}