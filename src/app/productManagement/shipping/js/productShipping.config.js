angular.module('orderCloud')
    .config(ProductShippingConfig)
;

function ProductShippingConfig($stateProvider) {
    $stateProvider
        .state('product.shipping', {
            url: '/shipping',
            templateUrl: 'productManagement/shipping/templates/productShipping.html',
            controller: 'ProductShippingCtrl',
            controllerAs: 'productShipping',
            data: {
                pageTitle: 'Product Shipping'
            },
            resolve: {
                SelectedShippingAddress: function(OrderCloudSDK, SelectedProduct) {
                    if (SelectedProduct.ShipFromAddressID) {
                        return OrderCloudSDK.AdminAddresses.Get(SelectedProduct.ShipFromAddressID);
                    } else {
                        return null;
                    }
                }
            }
        })
    ;
}