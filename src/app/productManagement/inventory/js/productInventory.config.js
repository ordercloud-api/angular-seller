angular.module('orderCloud')
    .config(ProductInventoryConfig)
;

function ProductInventoryConfig($stateProvider) {
    $stateProvider
        .state('productDetail.inventory', {
            url: '/inventory',
            templateUrl: 'productManagement/inventory/templates/productInventory.html',
            controller: 'ProductInventoryCtrl',
            controllerAs: 'productInventory',
            data: {
                pageTitle: 'Product Inventory'
            },
            resolve: {
                ProductInventory: function($stateParams, OrderCloud) {
                    return OrderCloud.Products.GetInventory($stateParams.productid);
                }
            }
        })
    ;
}