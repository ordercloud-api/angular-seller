angular.module('orderCloud')
    .controller('OrderShipmentsCtrl', OrderShipmentsController)
    .controller('OrderShipmentsCreateCtrl', OrderShipmentsCreateController)
;

function OrderShipmentsController($stateParams, OrderCloud, ocConfirm, ocOrderShipmentsService, OrderShipments) {
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

    vm.newShipment = function() {
        ocOrderShipmentsService.Create(vm.orderID);
    };

    vm.editShipment = function(shipment) {

    };

    vm.deleteShipment = function(shipment) {
        ocConfirm.Confirm({message: 'Are you sure you want to delete this shipment?'})
            .then(function() {
                OrderCloud.Shipments.Delete(shipment.ID, $stateParams.buyerid)
                    .then(function() {
                         //TODO: splice shipment out
                    });
            });
    };

    vm.editShipmentItem = function(item) {

    };

    vm.deleteShipmentItem = function(item) {
        ocConfirm.Confirm({message: 'Are you sure you want to delete this shipment item?'})
            .then(function() {
                console.log('delete');
            });
    };
}

function OrderShipmentsCreateController($state, $stateParams, $timeout, ocOrderShipmentsService, ShipmentLineItems) {
    var vm = this;
    vm.lineItems = ShipmentLineItems;

    vm.pageChanged = function() {
        ocOrderShipmentsService.ListLineItems($stateParams.orderid, $stateParams.buyerid, vm.lineItems.Meta.Page, vm.lineItems.Meta.PageSize)
            .then(function(data) {
                vm.lineItems = data;
            });
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
        //TODO: figure out how to deal with paginated line items
        ocOrderShipmentsService.Create(vm.shipment, vm.lineItems, $stateParams.orderid, $stateParams.buyerid)
            .then(function() {
                $state.go('^');
            });
    };
}