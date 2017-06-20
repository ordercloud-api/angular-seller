angular.module('orderCloud')
    .config(ProductImagesConfig)
;

function ProductImagesConfig($stateProvider) {
    $stateProvider
        .state('product.images', {
            url: '/images',
            templateUrl: 'productManagement/images/templates/productImages.html',
            controller: 'ProductImagesCtrl',
            controllerAs: 'productImages'
        })
}