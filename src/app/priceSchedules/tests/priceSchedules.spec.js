describe('Component: PriceSchedules', function() {
    var scope,
        q,
        priceSchedule,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope,OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        priceSchedule = {
            ID: "TestPriceSchedule123456789",
            Name: "TestPriceSchedule123456789",
            ApplyTax: true,
            ApplyShipping: false,
            MinQuantity: null,
            MaxQuantity: null,
            UseCumulativeQuantity: false,
            RestrictedQuantity: false,
            OrderType: "Standard",
            PriceBreaks: [
                    {
                        Quantity: 1,
                        Price: 5.0
                    }
                ]
        };
        oc = OrderCloud;
    }));

    describe('State: priceSchedules', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('priceSchedules');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.PriceSchedules, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve PriceScheduleList', inject(function($injector) {
            $injector.invoke(state.resolve.PriceScheduleList);
            expect(oc.PriceSchedules.List).toHaveBeenCalled();
        }));
    });

    describe('State: priceSchedules.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('priceSchedules.edit');
            spyOn(oc.PriceSchedules, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedPriceSchedule', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedPriceSchedule);
            expect(oc.PriceSchedules.Get).toHaveBeenCalledWith($stateParams.pricescheduleid);
        }));
    });


    describe('Controller: PriceScheduleEditCtrl', function() {
        var priceScheduleEditCtrl;
        beforeEach(inject(function($state, $controller) {
            priceScheduleEditCtrl = $controller('PriceScheduleEditCtrl', {
                $scope: scope,
                SelectedPriceSchedule: priceSchedule
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('addPriceBreak', function() {
            var quantity;
            var price;
            beforeEach(inject(function(PriceBreak) {
                priceScheduleEditCtrl.priceSchedule = priceSchedule;
                priceScheduleEditCtrl.quantity = quantity;
                priceScheduleEditCtrl.quantity = price;
                spyOn(PriceBreak, 'AddPriceBreak').and.returnValue(null);
                priceScheduleEditCtrl.addPriceBreak();
            }));
            it ('should call the PriceBreak addPriceBreak method', inject(function(PriceBreak) {
                expect(PriceBreak.AddPriceBreak).toHaveBeenCalledWith(priceSchedule, price, quantity);
            }));
        });

        describe('Submit', function() {
            beforeEach(function() {
                priceScheduleEditCtrl.priceSchedule = priceSchedule;
                priceScheduleEditCtrl.priceScheduleID = "TestPriceSchedule123456789";
                var defer = q.defer();
                defer.resolve(priceSchedule);
                spyOn(oc.PriceSchedules, 'Update').and.returnValue(defer.promise);
                priceScheduleEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the PriceSchedules Update method', function() {
                expect(oc.PriceSchedules.Update).toHaveBeenCalledWith(priceScheduleEditCtrl.priceScheduleID, priceScheduleEditCtrl.priceSchedule);
            });
            it ('should enter the priceSchedules state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('priceSchedules', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(priceSchedule);
                spyOn(oc.PriceSchedules, 'Delete').and.returnValue(defer.promise);
                priceScheduleEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the PriceSchedules Delete method', function() {
                expect(oc.PriceSchedules.Delete).toHaveBeenCalledWith(priceSchedule.ID);
            });
            it ('should enter the priceSchedules state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('priceSchedules', {}, {reload: true});
            }));
        });
    });

    describe('Controller: PriceScheduleCreateCtrl', function() {
        var priceScheduleCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            priceScheduleCreateCtrl = $controller('PriceScheduleCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('addPriceBreak', function() {
            var quantity;
            var price;
            beforeEach(inject(function(PriceBreak) {
                priceScheduleCreateCtrl.priceSchedule = priceSchedule;
                priceScheduleCreateCtrl.quantity = quantity;
                priceScheduleCreateCtrl.quantity = price;
                spyOn(PriceBreak, 'AddPriceBreak').and.returnValue(null);
                priceScheduleCreateCtrl.addPriceBreak();
            }));
            it ('should call the PriceBreak addPriceBreak method', inject(function(PriceBreak) {
                expect(PriceBreak.AddPriceBreak).toHaveBeenCalledWith(priceSchedule, price, quantity);
            }));
        });

        describe('Submit', function() {
            beforeEach(function() {
                priceScheduleCreateCtrl.priceSchedule = priceSchedule;
                var defer = q.defer();
                defer.resolve(priceSchedule);
                spyOn(oc.PriceSchedules, 'Create').and.returnValue(defer.promise);
                priceScheduleCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the PriceSchedules Create method', function() {
                expect(oc.PriceSchedules.Create).toHaveBeenCalledWith(priceSchedule);
            });
            it ('should enter the priceSchedules state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('priceSchedules', {}, {reload: true});
            }));
        });
    });
});



