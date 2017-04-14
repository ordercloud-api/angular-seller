angular.module('orderCloud')
    .config(ProductConfig)
;

function ProductConfig($stateProvider) {
    $stateProvider
        .state('product', {
            parent: 'base',
            url: '/products/:productid',
            templateUrl: 'productManagement/product/templates/product.html',
            controller: 'ProductCtrl',
            controllerAs: 'product',
            data: {
                pageTitle: 'Product Info'
            },
            resolve: {
                SelectedProduct: function ($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Products.Get($stateParams.productid)
                        .then(function(product) {
                            if (!product.DefaultPriceScheduleID) {
                                return product;
                            } else {
                                return OrderCloudSDK.PriceSchedules.Get(product.DefaultPriceScheduleID)
                                    .then(function(priceSchedule) {
                                        product.DefaultPriceSchedule = priceSchedule;
                                        return product;
                                    });
                            }
                        });
                }
            }
        })
    ;
}