angular.module('orderCloud')
    .config(ProductInventoryConfig)
;

function ProductInventoryConfig($stateProvider) {
    $stateProvider
        .state('product.inventory', {
            url: '/inventory',
            templateUrl: 'productManagement/inventory/templates/productInventory.html',
            controller: 'ProductInventoryCtrl',
            controllerAs: 'productInventory',
            data: {
                pageTitle: 'Product Inventory'
            }
        })
    ;
}