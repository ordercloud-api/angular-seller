angular.module('orderCloud')
    .controller('OrderShipmentsCtrl', OrderShipmentsController)
    .controller('OrderShipmentsCreateCtrl', OrderShipmentsCreateController)
    .controller('OrderShipmentsEditCtrl', OrderShipmentsEditController)
    .controller('OrderShipmentsCreateItemsCtrl', OrderShipmentsCreateItemsController)
    .controller('OrderShipmentsEditItemCtrl', OrderShipmentsEditItemController)
;

function OrderShipmentsController($stateParams, toastr, ocOrderShipmentsService, OrderShipments) {
    var vm = this;
    vm.list = OrderShipments;
    vm.orderID = $stateParams.orderid;

    vm.pageChanged = function() {
        ocOrderShipmentsService.List($stateParams.orderid, $stateParams.buyerid, vm.list.Meta.Page, vm.list.Meta.PageSize)
            .then(function(data) {
                vm.list = data;
            });
    };

    vm.loadMore = function() {
        vm.list.Meta.Page++;
        ocOrderShipmentsService.List($stateParams.orderid, $stateParams.buyerid, vm.list.Meta.Page, vm.list.Meta.PageSize)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.selectShipment = function(shipment) {
        vm.selectedShipment = angular.copy(shipment);
    };
    if (vm.list.Items.length) vm.selectShipment(vm.list.Items[0]);

    vm.editShipment = function() {
        ocOrderShipmentsService.Edit(vm.selectedShipment, $stateParams.buyerid)
            .then(function(data) {
                vm.selectedShipment = angular.extend(vm.selectedShipment, data);
                var shipmentIndex = 0;
                angular.forEach(vm.list.Items, function(shipment, index) {
                    if (shipment.ID == vm.selectedShipment.OriginalShipmentID) {
                        shipmentIndex = index;
                    }
                });
                vm.list.Items[shipmentIndex] = data;
                toastr.success('Shipment was updated.');
            });
    };

    vm.deleteShipment = function(shipment) {
        ocOrderShipmentsService.Delete(vm.selectedShipment.ID, $stateParams.buyerid)
            .then(function() {
                var shipmentIndex = 0;
                angular.forEach(vm.list.Items, function(shipment, index) {
                    if (shipment.ID == vm.selectedShipment.ID) {
                        shipmentIndex = index;
                    }
                });
                vm.list.Items.splice(shipmentIndex, 1);
                vm.selectedShipment = null;
                toastr.success('Shipment was deleted.');
            });
    };

    vm.createShipmentItems = function() {
        ocOrderShipmentsService.CreateItems(vm.selectedShipment, $stateParams.orderid, $stateParams.buyerid)
            .then(function(data) {
                vm.selectedShipment.Items = data.Items;
                toastr.success('Shipment item was created.');
            });
    };

    vm.editShipmentItem = function(item) {
        ocOrderShipmentsService.EditItem(item, vm.selectedShipment.ID, $stateParams.buyerid)
            .then(function(data) {
                angular.forEach(vm.selectedShipment.Items, function(item) {
                    if (item.LineItemID == data.LineItemID) {
                        item.QuantityShipped = data.QuantityShipped;
                    }
                });
                toastr.success('Shipment item was updated.');
            });
    };

    vm.deleteShipmentItem = function(item) {
        ocOrderShipmentsService.DeleteItem(vm.selectedShipment.ID, $stateParams.orderid, item.LineItemID, $stateParams.buyerid)
            .then(function() {
                var itemIndex = 0;
                angular.forEach(vm.selectedShipment.Items, function(shipmentItem, index) {
                    if (shipmentItem.LineItemID == item.LineItemID) {
                        itemIndex = index;
                    }
                });
                vm.selectedShipment.Items.splice(itemIndex, 1);
                toastr.success('Shipment item was deleted.');
            });
    };
}

function OrderShipmentsCreateController($state, $stateParams, $timeout, toastr, ocOrderShipmentsService, ShipmentLineItems) {
    var vm = this;
    vm.lineItems = ShipmentLineItems;
    vm.selectedLineItemPage = ShipmentLineItems.Meta.Page;
    _.each(vm.lineItems.Items, function(item) { item.MetaPage = vm.lineItems.Meta.Page});

    vm.pageChanged = function() {
        //Store line items for selections over multiple pages
        var cachedItems = _.filter(vm.lineItems.Items, function(item) { return item.MetaPage && item.MetaPage == vm.lineItems.Meta.Page});
        if (!cachedItems.length) {
            ocOrderShipmentsService.ListLineItems($stateParams.orderid, $stateParams.buyerid, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
                .then(function(data) {
                    vm.selectedLineItemPage = data.Meta.Page;
                    _.each(data.Items, function(item) { item.MetaPage = data.Meta.Page });
                    vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                });
        }
        else {
            vm.selectedLineItemPage = vm.lineItems.Meta.Page;
        }
    };

    vm.loadMore = function() {
        vm.lineItems.Meta.Page++;
        ocOrderShipmentsService.ListLineItems($stateParams.orderid, $stateParams.buyerid, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
            .then(function(data) {
                vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                vm.lineItem.Meta = data.Meta;
            });
    };

    $timeout(function(){
        vm.form.$setValidity('Shipment.ItemsSelected', false);
    });

    vm.itemChange = function() {
        var itemsSelected = false;
        angular.forEach(vm.lineItems.Items, function(lineItem) {
            if (lineItem.Selected && lineItem.ShipQuantity > 0) {
                itemsSelected = true;
            }
        });
        vm.form.$setValidity('Shipment.ItemsSelected', itemsSelected);
    };

    vm.submit = function() {
        ocOrderShipmentsService.Create(vm.shipment, vm.lineItems.Items, $stateParams.orderid, $stateParams.buyerid)
            .then(function() {
                $state.go('^', {}, {reload:true});
                toastr.success('Shipment was created.');
            });
    };
}

function OrderShipmentsEditController($uibModalInstance, OrderCloud, OrderShipment, BuyerID) {
    var vm = this;
    vm.shipment = angular.copy(OrderShipment);
    vm.shipmentID = OrderShipment.ID;
    if (vm.shipment.DateShipped) vm.shipment.DateShipped = new Date(vm.shipment.DateShipped);
    if (vm.shipment.DateDelivered) vm.shipment.DateDelivered = new Date(vm.shipment.DateDelivered);

    vm.updateValidity = function() {
        if (vm.form.ID.$error['Shipment.UnavailableID']) vm.form.ID.$setValidity('Shipment.UnavailableID', true);
    };

    vm.submit = function() {
        var partial = _.pick(vm.shipment, ['ID', 'TrackingNumber', 'Cost', 'DateShipped', 'DateDelivered']);
        if (partial.DateShipped) partial.DateShipped = new Date(partial.DateShipped);
        if (partial.DateDelivered) partial.DateDelivered = new Date(partial.DateDelivered);
        vm.loading = OrderCloud.Shipments.Patch(OrderShipment.ID, vm.shipment, BuyerID)
            .then(function(data) {
                var result = _.pick(data, ['ID', 'TrackingNumber', 'Cost', 'DateShipped', 'DateDelivered']);
                result.OriginalShipmentID = OrderShipment.ID;
                $uibModalInstance.close(result);
            })
            .catch(function(ex) {
                if (ex.status == 409) {
                    vm.form.ID.$setValidity('Shipment.UnavailableID', false);
                    vm.form.ID.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function OrderShipmentsCreateItemsController($q, $uibModalInstance, $exceptionHandler, $timeout, OrderCloud, ocOrderShipmentsService, ShipmentLineItems, Shipment, OrderID, BuyerID) {
    var vm = this;
    vm.lineItems = ShipmentLineItems;
    vm.selectedLineItemPage = ShipmentLineItems.Meta.Page;
    var existingShipmentsLineItemIDs = _.pluck(Shipment.Items, 'LineItemID');
    angular.forEach(vm.lineItems.Items, function(item) {
        item.MetaPage = vm.lineItems.Meta.Page;
        item.ExistingShipmentItem = existingShipmentsLineItemIDs.indexOf(item.ID) > -1;
    });

    vm.pageChanged = function() {
        //Store line items for selections over multiple pages
        var cachedItems = _.filter(vm.lineItems.Items, function(item) { return item.MetaPage && item.MetaPage == vm.lineItems.Meta.Page});
        if (!cachedItems.length) {
            ocOrderShipmentsService.ListLineItems(OrderID, BuyerID, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
                .then(function(data) {
                    vm.selectedLineItemPage = data.Meta.Page;
                    angular.forEach(data.Items, function(item) {
                        item.MetaPage = data.Meta.Page;
                        item.ExistingShipmentItem = existingShipmentsLineItemIDs.indexOf(item.ID);
                    });
                    vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                });
        }
        else {
            vm.selectedLineItemPage = vm.lineItems.Meta.Page;
        }
    };

    vm.loadMore = function() {
        vm.lineItems.Meta.Page++;
        ocOrderShipmentsService.ListLineItems(OrderID, BuyerID, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
            .then(function(data) {
                vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                vm.lineItem.Meta = data.Meta;
            });
    };

    $timeout(function(){
        vm.form.$setValidity('ShipmentItem.ItemsSelected', false);
    });

    vm.itemChange = function() {
        var itemsSelected = false;
        angular.forEach(vm.lineItems.Items, function(lineItem) {
            if (lineItem.Selected && lineItem.ShipQuantity > 0) {
                itemsSelected = true;
            }
        });
        vm.form.$setValidity('ShipmentItem.ItemsSelected', itemsSelected);
    };

    vm.submit = function() {
        var queue = [];
        angular.forEach(vm.lineItems.Items, function(lineItem) {
            if (lineItem.Selected && lineItem.ShipQuantity && lineItem.ShipQuantity > 0) {
                var shipmentItem = {
                    OrderID: OrderID,
                    LineItemID: lineItem.ID,
                    QuantityShipped: lineItem.ShipQuantity
                };
                queue.push(OrderCloud.Shipments.SaveItem(Shipment.ID, shipmentItem, BuyerID));
            }
        });

        vm.loading = $q.all(queue)
            .then(function(results) {
                var lastResult = results[results.length - 1];
                angular.forEach(lastResult.Items, function(shipmentItem) {
                    shipmentItem.LineItem = _.findWhere(vm.lineItems.Items, {ID: shipmentItem.LineItemID});
                });
                $uibModalInstance.close(lastResult);
            }, function(ex) {
                $uibModalInstance.dismiss();
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function OrderShipmentsEditItemController($uibModalInstance, OrderCloud, ShipmentItem, ShipmentID, BuyerID) {
    var vm = this;
    vm.shipmentItem = angular.copy(ShipmentItem);
    vm.itemID = ShipmentItem.ID;

    vm.submit = function() {
        vm.loading = OrderCloud.Shipments.SaveItem(ShipmentID, vm.shipmentItem, BuyerID)
            .then(function(data) {
                $uibModalInstance.close(vm.shipmentItem);
            })
            .catch(function(ex) {
                if (ex.status == 409) {
                    vm.form.ID.$setValidity('Shipment.UnavailableID', false);
                    vm.form.ID.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}