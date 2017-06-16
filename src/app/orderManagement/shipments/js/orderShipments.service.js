angular.module('orderCloud')
    .factory('ocOrderShipmentsService', OrderCloudOrderShipmentsService)
;

function OrderCloudOrderShipmentsService($q, $uibModal, ocConfirm, OrderCloudSDK) {
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

    function _list(orderID, page, pageSize) {
        var deferred = $q.defer();

        var options = {
            orderID: orderID,
            page: page,
            pageSize: pageSize
        };
        OrderCloudSDK.Shipments.List(options)
            .then(function(data) {
                getShipmentItems(data);
            });

        function getShipmentItems(data) {
            var queue = [];

            angular.forEach(data.Items, function(shipment) {
                queue.push((function() {
                    var d = $q.defer();

                    OrderCloudSDK.Shipments.ListItems(shipment.ID)
                        .then(function(shipmentItems) {
                            shipment.Items = shipmentItems.Items;
                            d.resolve();
                        });

                    return d.promise;
                })());
            });

            $q.all(queue).then(function() {
                getLineItems(data);
            });
        }

        function getLineItems(data) {
            var lineItemIDs = _.uniq(_.flatten(_.map(data.Items, function(shipment) { return _.map(shipment.Items, 'LineItemID');})));
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: lineItemIDs.join('|')}
            };
            OrderCloudSDK.LineItems.List('incoming', orderID, options)
                .then(function(lineItemData) {
                    angular.forEach(data.Items, function(shipment) {
                        angular.forEach(shipment.Items, function(shipmentItem) {
                            shipmentItem.LineItem = _.find(lineItemData.Items, {ID: shipmentItem.LineItemID});
                        });
                    });

                    analyzeShippingAddresses(data);
                });
        }

        function analyzeShippingAddresses(data) {
            angular.forEach(data.Items, function(shipment) {
                var shippingAddressCount = _.uniq(_.map(shipment.Items, function(item) { return (item.LineItem.ShippingAddress ? (item.LineItem.ShippingAddress.ID ? item.LineItem.ShippingAddress.ID : item.LineItem.ShippingAddress.Street1) : item.LineItem.ShippingAddressID); })).length;
                shipment.ShippingAddress = (shippingAddressCount == 1) ? shipment.Items[0].LineItem.ShippingAddress : null;
            });

            deferred.resolve(data);
        }

        return deferred.promise;
    }

    function _listLineItems(orderID, page, pageSize) {
        var deferred = $q.defer();

        var options = {
            page: page,
            pageSize: pageSize
        };
        OrderCloudSDK.LineItems.List('incoming', orderID, options)
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

        var shipmentCopy = angular.copy(shipment);

        if (shipmentCopy.DateShipped && (typeof shipmentCopy.DateShipped.getDate == 'function')) shipmentCopy.DateShipped = shipmentCopy.DateShipped.toISOString();
        if (shipmentCopy.DateDelivered && (typeof shipmentCopy.DateDelivered.getDate == 'function')) shipmentCopy.DateDelivered = shipmentCopy.DateDelivered.toISOString();

        var toAddressID = _.find(lineItems, {Selected: true}).ShippingAddressID;
        var toAddress = _.find(lineItems, {Selected: true}).ShippingAddressID;

        var shipmentModel = {
            buyerID: buyerID,
            shipper: shipmentCopy.Shipper,
            dateShipped: shipmentCopy.DateShipped,
            dateDeliveryed: shipmentCopy.DateDelivered,
            trackingNumber: shipmentCopy.TrackingNumber,
            cost: shipmentCopy.Cost
        };
        toAddressID ? (shipmentModel.ShipToAddressID = toAddressID) : (shipmentModel.ToAddress = toAddress);

        OrderCloudSDK.Shipments.Create(shipmentModel)
            .then(function(data) {
                createShipmentItems(data);
            });

        function createShipmentItems(shipmentData) {
            var queue = [];
            angular.forEach(lineItems, function(lineItem) {
                if (lineItem.Selected && lineItem.ShipQuantity && lineItem.ShipQuantity > 0) {
                    queue.push((function() {
                        var d = $q.defer();

                        var product = {};
                        _.each(lineItem.Product, function(val, key) {
                            if (key == 'ID') {
                                product.ID = val;
                            } else {
                                product[key] = val;
                            }
                        });
                        var shipmentItem = {
                            orderID: orderID,
                            lineItemID: lineItem.ID,
                            quantityShipped: lineItem.ShipQuantity,
                            unitPrice: lineItem.UnitPrice,
                            costCenter: lineItem.CostCenter,
                            dateNeeded: lineItem.DatNeeded,
                            product: product
                        };
                        OrderCloudSDK.Shipments.SaveItem(shipmentData.ID, shipmentItem)
                            .then(function(item) {
                                d.resolve(item);
                            });

                        return d.promise;
                    })());
                }
            });

            $q.all(queue).then(function(results) {
                shipmentData.Items = results;
                deferred.resolve(shipmentData);
            });
        }

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
        }).result;
    }

    function _delete(shipmentID) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + shipmentID + '</b>?',
                confirmText: 'Delete shipment',
                type: 'delete'})
            .then(function() {
                return OrderCloudSDK.Shipments.Delete(shipmentID);
            });
    }

    function _createItems(shipment, orderID, buyerID) {
        return $uibModal.open({
            templateUrl: 'orderManagement/shipments/templates/orderShipmentsCreateItem.modal.html',
            size: 'lg',
            controller: 'OrderShipmentsCreateItemsCtrl',
            controllerAs: 'orderShipmentsCreateItems',
            resolve: {
                Shipment: function() {
                    return shipment;
                },
                ShipmentLineItems: function() {
                    return _listLineItems(orderID);
                },
                OrderID: function() {
                    return orderID;
                },
                BuyerID: function() {
                    return buyerID;
                }
            }
        }).result;
    }

    function _editItem(item, shipmentID) {
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
                }
            }
        }).result;
    }

    function _deleteItem(shipmentID, orderID, lineItemID) {
        return ocConfirm.Confirm({
            message:'Are you sure you want to delete this shipment item? <br>' + lineItemID,
            confirmText: 'Delete shipment item'})
            .then(function() {
                return OrderCloudSDK.Shipments.DeleteItem(shipmentID, orderID, lineItemID);
            });
    }

    return service;
}