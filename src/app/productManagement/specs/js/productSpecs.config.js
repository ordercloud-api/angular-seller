angular.module('orderCloud')
    .config(ProductSpecsConfig)
;

function ProductSpecsConfig($stateProvider) {
    $stateProvider
        .state('productDetail.specs', {
            url: '/specs',
            templateUrl: 'productManagement/specs/templates/productSpecs.html',
            controller: 'ProductSpecsCtrl',
            controllerAs: 'productSpecs',
            resolve: {
                ProductSpecs: function($stateParams, ocProductSpecs) {
                    return ocProductSpecs.ProductSpecsDetail($stateParams.productid);
                }
            }
        })
    ;
}