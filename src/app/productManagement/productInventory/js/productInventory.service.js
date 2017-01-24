angular.module('orderCloud')
    .factory('ocProductInventory', ocProductInventoryService)
;

function ocProductInventoryService($q, OrderCloud) {
    var service = {
        Update: _update
    };

    function _update(product, inventory) {
        var deferred = $q.defer();
        var inventoryResult;
        var queue = [];

        var productPartial = _.pick(product, ['InventoryNotificationPoint', 'AllowOrderExceedInventory']);
        queue.push(OrderCloud.Products.Patch(product.ID, productPartial));

        queue.push((function() {
            var d = $q.defer();

            OrderCloud.Products.UpdateInventory(product.ID, inventory.Available)
                .then(function(data) {
                    inventoryResult = data;
                    d.resolve();
                })
                .catch(function(ex) {
                    inventoryResult = ex;
                    d.reject();
                });

            return d.promise;
        })());

        $q.all(queue)
            .then(function() {
                deferred.resolve(inventoryResult);
            })
            .catch(function() {
                deferred.reject(inventoryResult);
            });

        return deferred.promise;
    }

    return service;
}