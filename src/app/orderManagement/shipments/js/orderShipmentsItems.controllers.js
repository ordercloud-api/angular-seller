angular.module('orderCloud')
    .controller('OrderShipmentsCreateItemsCtrl', OrderShipmentsCreateItemsController)
    .controller('OrderShipmentsEditItemCtrl', OrderShipmentsEditItemController)
;

function OrderShipmentsCreateItemsController($q, $uibModalInstance, $exceptionHandler, $timeout, toastr, OrderCloudSDK, ocOrderShipmentsService, ShipmentLineItems, Shipment, OrderID, BuyerID) {
    var vm = this;
    vm.lineItems = ShipmentLineItems;
    vm.shipment = Shipment;
    vm.selectedLineItemPage = ShipmentLineItems.Meta.Page;
    var existingShipmentsLineItemIDs = _.map(Shipment.Items, 'LineItemID');
    angular.forEach(vm.lineItems.Items, function(item) {
        item.MetaPage = vm.lineItems.Meta.Page;
        item.ExistingShipmentItem = existingShipmentsLineItemIDs.indexOf(item.ID) > -1;
    });

    vm.pageChanged = function() {
        //Store line items for selections over multiple pages
        var cachedItems = _.filter(vm.lineItems.Items, function(item) { return item.MetaPage && item.MetaPage == vm.lineItems.Meta.Page;});
        if (!cachedItems.length) {
            ocOrderShipmentsService.ListLineItems(OrderID, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
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
        ocOrderShipmentsService.ListLineItems(OrderID, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
            .then(function(data) {
                vm.lineItems.Items = vm.lineItems.Items.concat(data.Items);
                vm.lineItem.Meta = data.Meta;
            });
    };

    $timeout(function(){
        vm.form.$setValidity('ShipmentItem.ItemsSelected', false);
    });

    vm.itemChange = function(lineItem) {
        var selectedItems = _.filter(vm.lineItems.Items, function(item) { return item.Selected; });
        if (vm.shipment.ShippingAddress && selectedItems.length && ((vm.shipment.ShippingAddress.ID || vm.shipment.ShippingAddress.Street1) != (vm.shipment.ShippingAddress.ID ? lineItem.ShippingAddressID : lineItem.ShippingAddress.Street1))) {
            toastr.error('All items within this shipment must be shipped to the same address.');
            lineItem.Selected = false;
            return;
        }

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
                var product = {};
                _.each(lineItem.Product, function(val, key) {
                    if (key == 'ID') {
                        product.ID = val;
                    } else {
                        product[key] = val;
                    }
                });
                var shipmentItem = {
                    orderID: OrderID,
                    lineItemID: lineItem.ID,
                    quantityShipped: lineItem.ShipQuantity,
                    unitPrice: lineItem.UnitPrice,
                    costCenter: lineItem.CostCenter,
                    dateNeeded: lineItem.DatNeeded,
                    product: product
                };
                queue.push(OrderCloudSDK.Shipments.SaveItem(Shipment.ID, shipmentItem));
            }
        });

        vm.loading = $q.all(queue)
            .then(function(results) {
                angular.forEach(results, function(shipmentItem) {
                    shipmentItem.LineItem = _.find(vm.lineItems.Items, {ID: shipmentItem.LineItemID});
                });
                $uibModalInstance.close(results);
            }, function(ex) {
                $uibModalInstance.dismiss();
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function OrderShipmentsEditItemController($uibModalInstance, OrderCloudSDK, ShipmentItem, ShipmentID) {
    var vm = this;
    vm.shipmentItem = angular.copy(ShipmentItem);
    vm.itemID = ShipmentItem.ID;

    vm.submit = function() {
        var product = {};
        _.each(vm.shipmentItem.Product, function(val, key) {
            if (key == 'ID') {
                product.ID = val;
            } else {
                product[key] = val;
            }
        });
        var shipmentItem = {
            orderID: vm.shipmentItem.OrderID,
            lineItemID: vm.shipmentItem.LineItemID,
            quantityShipped: vm.shipmentItem.ShipQuantity,
            unitPrice: vm.shipmentItem.UnitPrice,
            costCenter: vm.shipmentItem.CostCenter,
            dateNeeded: vm.shipmentItem.DatNeeded,
            product: product
        };
        vm.loading = OrderCloudSDK.Shipments.SaveItem(ShipmentID, vm.shipmentItem)
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