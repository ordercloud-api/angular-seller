describe('Component: Shipments', function() {
    var scope,
        q,
        shipment,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module(function($provide){
        $provide.value('SelectedShipment', {ID: "TestShipment123456789", Shipper: "USPS", DateShipped: null, Cost: 7,
            Items: [{OrderID: "TestOrder123456789", LineItemId: "TestLineItem123456789", QuantityShipped: 2}]})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        shipment =
            {
            ID: "TestShipment123456789",
            Shipper: "USPS",
            DateShipped: null,
            Cost: 7,
            Items: [
                {
                    OrderID: "TestOrder123456789",
                    LineItemId: "TestLineItem123456789",
                    QuantityShipped: 2
                }
            ]
        };
        oc = OrderCloud;
    }));

    describe('State: shipments', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('shipments');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Shipments, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve ShipmentList', inject(function($injector) {
            $injector.invoke(state.resolve.ShipmentList);
            expect(oc.Shipments.List).toHaveBeenCalled();
        }));
    });

    describe('State: shipments.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('shipments.edit');
            spyOn(oc.Shipments, 'Get').and.returnValue(null);
            spyOn(oc.Orders, 'ListIncoming').and.returnValue(null);
        }));
        it('should resolve SelectedShipment', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedShipment);
            expect(oc.Shipments.Get).toHaveBeenCalledWith($stateParams.shipment);
        }));
        it('should resolve OrderList', inject(function($injector) {
            $injector.invoke(state.resolve.OrderList);
            expect(oc.Orders.ListIncoming).toHaveBeenCalledWith(null, null, shipment.Items[0].OrderID);
        }));
    });

    describe('State: shipments.create', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('shipments.create');
            spyOn(oc.Orders, 'ListIncoming').and.returnValue(null);
        }));
        it('should resolve OrderList', inject(function($injector) {
            $injector.invoke(state.resolve.OrderList);
            expect(oc.Orders.ListIncoming).toHaveBeenCalled();
        }));
    });

    describe('Controller: ShipmentEditCtrl', function() {
        var shipmentEditCtrl, order;
        beforeEach(inject(function($state, $controller) {
            shipmentEditCtrl = $controller('ShipmentEditCtrl', {
                $scope: scope,
                SelectedShipment: shipment,
                OrderList: [],
                lineitems: {
                    list: {
                        Items: [
                            {
                                addToShipment: false,
                                disabled: false
                            }
                        ]
                    }
                },
                OrderSelected: true
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('unselectOrder', function() {
           beforeEach(inject(function() {
               shipmentEditCtrl.lineitems.list = [1, 2, 3];
               shipmentEditCtrl.OrderSelected = true;
               shipmentEditCtrl.unselectOrder();
           }));
            it('should make OrderSelected false', inject(function() {
                expect(shipmentEditCtrl.OrderSelected).toEqual(false);
            }));
            it('should empty list', inject(function() {
                expect(shipmentEditCtrl.lineitems.list.length).toEqual(0);
            }));
        });

        describe('deleteLineItem', function() {
            beforeEach(function() {
                spyOn(oc.Shipments, 'Patch').and.returnValue(null);
                shipmentEditCtrl.OrderSelected = false;
                shipmentEditCtrl.lineitems.list.Items = [
                            {
                                addToShipment: true,
                                disabled: true
                            }
                ];
                var index = 0;
                shipmentEditCtrl.shipment = shipment;
                shipmentEditCtrl.deleteLineItem(index);
            });
            it('should call the Shipments Patch method', function() {
                expect(oc.Shipments.Patch).toHaveBeenCalledWith(shipment.ID, {Items: shipmentEditCtrl.shipment.Items});
            });
            it('should make addToShipment false', inject(function() {
                expect(shipmentEditCtrl.lineitems.list.Items[0].addToShipment).toEqual(false);
            }));
            it('should make disabled false', inject(function() {
                expect(shipmentEditCtrl.lineitems.list.Items[0].disabled).toEqual(false);
            }));
            it('should empty shipment list', inject(function() {
                expect(shipmentEditCtrl.shipment.Items.length).toEqual(0);
            }));
        });

        describe('goToLineItems', function() {
            beforeEach(function() {
                order = {
                    ID: 'TestOrder123456789'
                };
                var defer = q.defer();
                defer.resolve(shipment);
                spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
                shipmentEditCtrl.goToLineItems(order);
                scope.$digest();
            });
            it('should call the LineItems List method', function() {
                expect(oc.LineItems.List).toHaveBeenCalledWith(order.ID, null, 1, 20);
            });
        });

        describe('Submit', function() {
            beforeEach(function() {
                shipmentEditCtrl.shipment = shipment;
                shipmentEditCtrl.shipmentID = "TestShipment123456789";
                var defer = q.defer();
                defer.resolve(shipment);
                spyOn(oc.Shipments, 'Update').and.returnValue(defer.promise);
                shipmentEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Shipments Update method', function() {
                expect(oc.Shipments.Update).toHaveBeenCalledWith(shipmentEditCtrl.shipmentID, shipmentEditCtrl.shipment);
            });
            it ('should enter the shipments state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('shipments', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(shipment);
                spyOn(oc.Shipments, 'Delete').and.returnValue(defer.promise);
                shipmentEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Shipments Delete method', function() {
                expect(oc.Shipments.Delete).toHaveBeenCalledWith(shipment.ID, false);
            });
            it ('should enter the shipments state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('shipments', {}, {reload: true});
            }));
        });

        describe('pagingfunction', function() {
            beforeEach(function() {
                spyOn(oc.LineItems, 'List').and.returnValue(null);
                shipmentEditCtrl.lineitems.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                shipmentEditCtrl.lineitems.pagingfunction();
            });
            it ('should call the LineItems List method', function() {
                expect(oc.LineItems.List).toHaveBeenCalledWith(false, shipmentEditCtrl.lineitems.list.Meta.Page +1, shipmentEditCtrl.lineitems.list.Meta.PageSize);
            });
        });
    });

    describe('Controller: ShipmentCreateCtrl', function() {
        var shipmentCreateCtrl, order;
        beforeEach(inject(function($state, $controller) {
            shipmentCreateCtrl = $controller('ShipmentCreateCtrl', {
                $scope: scope,
                OrderList: []
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('goToLineItems', function() {
            beforeEach(function() {
                order = {
                    ID: 'TestOrder123456789'
                };
                var defer = q.defer();
                defer.resolve(shipment);
                spyOn(oc.LineItems, 'List').and.returnValue(defer.promise);
                shipmentCreateCtrl.goToLineItems(order);
                scope.$digest();
            });
            it('should call the LineItems List method', function() {
                expect(oc.LineItems.List).toHaveBeenCalledWith(order.ID, null, 1, 20);
            });
        });

        describe('unselectOrder', function() {
            beforeEach(inject(function() {
                shipmentCreateCtrl.lineitems.list = [1, 2, 3];
                shipmentCreateCtrl.OrderSelected = true;
                shipmentCreateCtrl.unselectOrder();
            }));
            it('should make OrderSelected false', inject(function() {
                expect(shipmentCreateCtrl.OrderSelected).toEqual(false);
            }));
            it('should empty list', inject(function() {
                expect(shipmentCreateCtrl.lineitems.list.length).toEqual(0);
            }));
        });

        describe('Submit', function() {
            beforeEach(function() {
                shipmentCreateCtrl.shipment = shipment;
                var defer = q.defer();
                defer.resolve(shipment);
                spyOn(oc.Shipments, 'Create').and.returnValue(defer.promise);
                shipmentCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Shipments Create method', function() {
                expect(oc.Shipments.Create).toHaveBeenCalledWith(shipment);
            });
            it ('should enter the shipments state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('shipments', {}, {reload: true});
            }));
        });
    });
});

