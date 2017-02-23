angular.module('orderCloud')
    .factory('ocOrderShipmentsService', OrderCloudOrderShipmentsService)
;

function OrderCloudOrderShipmentsService($q, $uibModal, ocConfirm, OrderCloud) {
    var service = {
        List: _list,
        ListLineItems: _listLineItems,
        Create: _create,
        Edit: _edit,
        Delete: _delete,
        CreateItems: _createItems,
        EditItem: _editItem,
        DeleteItem: _deleteItem
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

                    analyzeShippingAddresses(data);
                });
        }

        function analyzeShippingAddresses(data) {
            angular.forEach(data.Items, function(shipment) {
                var shippingAddressCount = _.uniq(_.map(shipment.Items, function(item) { return (item.LineItem.ShippingAddress ? (item.LineItem.ShippingAddress.ID ? item.LineItem.ShippingAddress.ID : item.LineItem.ShippingAddress.Street1) : item.LineItem.ShippingAddressID) })).length;
                shipment.ShippingAddress = (shippingAddressCount == 1) ? shipment.Items[0].LineItem.ShippingAddress : null;
            });

            deferred.resolve(data);
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
        var shipmentModel = angular.copy(shipment);

        shipmentModel.Items = [];
        angular.forEach(lineItems, function(lineItem) {
             if (lineItem.Selected && lineItem.ShipQuantity && lineItem.ShipQuantity > 0) {
                 shipmentModel.Items.push({
                     LineItemID: lineItem.ID,
                     OrderID: orderID,
                     QuantityShipped: lineItem.ShipQuantity
                 });
             }
        });

        if (shipmentModel.DateShipped && (typeof shipmentModel.DateShipped.getDate == 'function')) shipmentModel.DateShipped = shipmentModel.DateShipped.toISOString();
        if (shipmentModel.DateDelivered && (typeof shipmentModel.DateDelivered.getDate == 'function')) shipmentModel.DateDelivered = shipmentModel.DateDelivered.toISOString();

        OrderCloud.Shipments.Create(shipmentModel, buyerID)
            .then(function(data) {
                deferred.resolve(data);
            });

        return deferred.promise;
    }

    function _edit(shipment, buyerID) {
        return $uibModal.open({
            templateUrl: 'orderManagement/shipments/templates/orderShipmentsEdit.modal.html',
            controller: 'OrderShipmentsEditCtrl',
            controllerAs: 'orderShipmentsEdit',
            resolve: {
                OrderShipment: function() {
                    return shipment;
                },
                BuyerID: function() {
                    return buyerID;
                }
            }
        }).result
    }

    function _delete(shipmentID, buyerID) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + shipmentID + '</b>?',
                confirmText: 'Delete shipment',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Shipments.Delete(shipmentID, buyerID);
            });
    }

    function _createItems(shipment, orderID, buyerID) {
        return $uibModal.open({
            templateUrl: 'orderManagement/shipments/templates/orderShipmentsCreateItem.modal.html',
            size: 'lg',
            controller: 'OrderShipmentsCreateItemsCtrl',
            controllerAs: 'orderShipmentsCreateItems',
            resolve: {
                ShipmentLineItems: function(ocOrderShipmentsService) {
                    return ocOrderShipmentsService.ListLineItems(orderID, buyerID);
                },
                Shipment: function() {
                    return shipment;
                },
                OrderID: function() {
                    return orderID;
                },
                BuyerID: function() {
                    return buyerID;
                }
            }
        }).result
    }

    function _editItem(item, shipmentID, buyerID) {
        return $uibModal.open({
            templateUrl: 'orderManagement/shipments/templates/orderShipmentsEditItem.modal.html',
            controller: 'OrderShipmentsEditItemCtrl',
            controllerAs: 'orderShipmentsEditItem',
            resolve: {
                ShipmentItem: function() {
                    return item;
                },
                ShipmentID: function() {
                    return shipmentID;
                },
                BuyerID: function() {
                    return buyerID;
                }
            }
        }).result
    }

    function _deleteItem(shipmentID, orderID, lineItemID, buyerID) {
        return ocConfirm.Confirm({
            message:'Are you sure you want to delete this shipment item? <br>' + lineItemID,
            confirmText: 'Delete shipment item'})
            .then(function() {
                return OrderCloud.Shipments.DeleteItem(shipmentID, orderID, lineItemID, buyerID);
            });
    }

    return service;
}