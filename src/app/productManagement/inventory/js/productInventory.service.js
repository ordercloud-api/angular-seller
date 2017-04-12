angular.module('orderCloud')
    .factory('ocProductInventory', ocProductInventoryService)
;

function ocProductInventoryService($q, OrderCloudSDK) {
    var service = {
        Update: _update
    };

    function _update(product) {
        var deferred = $q.defer();
        var inventoryResult;
        var queue = [];

        var productPartial = _.pick(product, ['Inventory']);

        OrderCloudSDK.Products.Patch(product.ID, productPartial)
            .then(function(updatedProduct) {
                deferred.resolve(updatedProduct);
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    return service;
}