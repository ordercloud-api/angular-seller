angular.module('orderCloud')
    .config(ProductDetailConfig)
;

function ProductDetailConfig($stateProvider) {
    $stateProvider
        .state('productDetail', {
            parent: 'base',
            url: '/product/:productid',
            templateUrl: 'productManagement/product/templates/productDetail.html',
            controller: 'ProductDetailCtrl',
            controllerAs: 'productDetail',
            resolve: {
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                }
            }
        })
    ;
}