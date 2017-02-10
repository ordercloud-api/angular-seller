angular.module('orderCloud')
    .factory('ocOrderShipmentsService', OrderCloudOrderShipmentsService)
;

function OrderCloudOrderShipmentsService($q, OrderCloud) {
    var service = {
        List: _list,
        ListLineItems: _listLineItems,
        Create: _create
    };

    function _list(orderID, buyerID, page, pageSize) {
        var deferred = $q.defer();

        OrderCloud.Shipments.List(orderID, null, page, pageSize, null, null, null, buyerID)
            .then(function(data) {
                getLineItems(data);
            });

        function getLineItems(data) {
            var lineItemIDs = _.uniq(_.flatten(_.map(data.Items, function(shipment) { return _.pluck(shipment.Items, 'LineItemID')})));
            OrderCloud.LineItems.List(orderID, null, 1, 100, null, null, {ID: lineItemIDs.join('|')}, buyerID)
                .then(function(lineItemData) {
                    angular.forEach(data.Items, function(shipment) {
                        angular.forEach(shipment.Items, function(shipmentItem) {
                            shipmentItem.LineItem = _.findWhere(lineItemData.Items, {ID: shipmentItem.LineItemID});
                        });
                    });

                    deferred.resolve(data);
                });
        }

        return deferred.promise;
    }

    function _listLineItems(orderID, buyerID, page, pageSize) {
        var deferred = $q.defer();

        OrderCloud.LineItems.List(orderID, null, page, pageSize, null, null, null, buyerID)
            .then(function(data) {
                 analyzeShipments(data);
            });

        function analyzeShipments(data) {
            angular.forEach(data.Items, function(lineItem) {
                lineItem.Selected = false;
                lineItem.ShipQuantity = lineItem.Quantity - lineItem.QuantityShipped;
            });

            deferred.resolve(data);
        }

        return deferred.promise;
    }

    function _create(shipment, lineItems, orderID, buyerID) {
        var deferred = $q.defer();

        shipment.Items = [];
        angular.forEach(lineItems, function(lineItem) {
             if (lineItem.Selected && lineItem.ShipQuantity && lineItem.ShipQuantity > 0) {
                 shipment.Items.push({
                     LineItemID: lineItem.ID,
                     OrderID: orderID,
                     QuantityShipped: lineItem.ShipQuantity
                 });
             }
        });

        OrderCloud.Shipments.Create(shipment, buyerID)
            .then(function(data) {
                deferred.resolve(data);
            });

        return deferred.promise;
    }

    return service;
}