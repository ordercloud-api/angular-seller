angular.module('orderCloud')
    .config(ShipmentsConfig)
    .controller('ShipmentsCtrl', ShipmentsController)
    .controller('ShipmentEditCtrl', ShipmentEditController)
    .controller('ShipmentCreateCtrl', ShipmentCreateController)
;

function ShipmentsConfig($stateProvider) {
    $stateProvider
        .state('shipments', {
            parent: 'base',
            templateUrl: 'shipments/templates/shipments.tpl.html',
            controller: 'ShipmentsCtrl',
            controllerAs: 'shipments',
            url: '/shipments?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Shipments'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                ShipmentList: function(OrderCloud, Parameters) {
                    return OrderCloud.Shipments.List(Parameters.orderID, Parameters.search, Parameters.page, Parameters.pageSize);
                }
            }
        })
        .state('shipments.edit', {
            url: '/:shipmentid/edit',
            templateUrl: 'shipments/templates/shipmentEdit.tpl.html',
            controller: 'ShipmentEditCtrl',
            controllerAs: 'shipmentEdit',
            resolve: {
                SelectedShipment: function($stateParams, OrderCloud) {
                    return OrderCloud.Shipments.Get($stateParams.shipmentid);
                },
                OrderList: function(OrderCloud, SelectedShipment) {
                    return OrderCloud.Orders.ListIncoming(null,null,SelectedShipment.Items[0].OrderID);

                }
            }
        })
        .state('shipments.create', {
            url: '/create',
            templateUrl: 'shipments/templates/shipmentCreate.tpl.html',
            controller: 'ShipmentCreateCtrl',
            controllerAs: 'shipmentCreate',
            resolve: {
                OrderList: function(OrderCloud) {
                     return OrderCloud.Orders.ListIncoming();
                }
            }
        })
    ;
}

function ShipmentsController($state, $ocMedia, OrderCloud, OrderCloudParameters, ShipmentList, Parameters) {
    var vm = this;
    vm.list = ShipmentList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.Shipments(Parameters.from, Parameters.to, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function ShipmentEditController($exceptionHandler, $state, OrderCloud, SelectedShipment, OrderList, toastr, Parameters) {
    var vm = this,
        shipmentid = SelectedShipment.ID;
    vm.ShipmentID = SelectedShipment.ID;
    vm.shipment = SelectedShipment;
    vm.list = OrderList;
    vm.parameters = Parameters;
    vm.OrderSelected = false;
    vm.lineitems = {
        pagingfunction: PagingFunction,
        list: []
    };
    if (vm.shipment.DateShipped != null) {
        vm.shipment.DateShipped = new Date(vm.shipment.DateShipped);
    }

    vm.goToLineItems = function(order) {
        vm.OrderSelected = order.ID;
        OrderCloud.LineItems.List(vm.OrderSelected,null, 1, 20)
            .then(function(data) {
                vm.lineitems.list = data;
                angular.forEach(vm.lineitems.list.Items, function(li) {
                    angular.forEach(vm.shipment.Items, function(shipli) {
                        if (shipli.LineItemId === li.ID) {
                            li.addToShipment = true;
                            li.disabled = true;

                        }
                    });
                });
            });
    };

    vm.unselectOrder = function() {
        vm.OrderSelected = false;
        vm.lineitems.list = [];
    };

    vm.deleteLineItem = function(index) {
        vm.shipment.Items.splice(index, 1);
        OrderCloud.Shipments.Patch(shipmentid, {Items: vm.shipment.Items});
        if (vm.lineitems.list.Items) {
            vm.lineitems.list.Items[index].addToShipment = false;
            vm.lineitems.list.Items[index].disabled = false;
        }
    };

    vm.Submit = function() {
        angular.forEach(vm.lineitems.list.Items, function(li) {
            if (li.addToShipment && !li.disabled) {
                vm.shipment.Items.push({OrderID: vm.OrderSelected , LineItemId: li.ID, QuantityShipped: li.QuantityShipped});
            }
        });

        OrderCloud.Shipments.Update(shipmentid, vm.shipment)
            .then(function() {
                $state.go('shipments', {}, {reload: true});
                toastr.success('Shipment Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.Shipments.Delete(shipmentid, false)
            .then(function() {
                $state.go('shipments', {}, {reload: true});
                toastr.success('Shipment Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    function PagingFunction() {
        OrderCloud.LineItems.List(vm.OrderSelected, vm.lineitems.list.Meta.Page + 1, vm.lineitems.list.Meta.PageSize);
    }
}

function ShipmentCreateController($exceptionHandler, $state, OrderCloud, OrderList, toastr) {
    var vm = this;
    vm.shipment = {};
    vm.list = OrderList;
    vm.OrderSelected = false;
    vm.shipment.Items = [];
    vm.lineitems = {};
    vm.lineitems.list = [];
    vm.orderID;

    vm.goToLineItems = function(order) {
        vm.orderID=order.ID;
        OrderCloud.LineItems.List(order.ID,null, 1, 20)
            .then(function(data) {
                vm.lineitems.list = data;
                vm.OrderSelected = true;
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.unselectOrder = function() {
        vm.OrderSelected = false;
        vm.lineitems.list = [];
    };

    vm.Submit = function() {
        angular.forEach(vm.lineitems.list.Items, function(li) {
            if (li.addToShipment) {
                vm.shipment.Items.push({OrderID: vm.orderID, LineItemId: li.ID, QuantityShipped: li.QuantityShipped});
            }
        });
        OrderCloud.Shipments.Create(vm.shipment)
            .then(function() {
                $state.go('shipments', {}, {reload: true});
                toastr.success('Shipment Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}