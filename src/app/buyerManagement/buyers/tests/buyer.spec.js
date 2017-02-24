describe('Component: Buyers', function() {
    var scope,
        q,
        buyer,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, filters: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        buyer = {
            ID: "TestBuyer123456789",
            Name: "TestBuyerTest",
            Active: true
        };
        oc = OrderCloud;
    }));

    describe('State: buyers', function() {
        var state;
        beforeEach(inject(function($state, ocParameters) {
            state = $state.get('buyers');
            spyOn(ocParameters, 'Get');
            spyOn(oc.Buyers, 'List');
        }));
        it('should resolve Parameters', inject(function($injector, ocParameters, $stateParams){
            $injector.invoke(state.resolve.Parameters);
            expect(ocParameters.Get).toHaveBeenCalledWith($stateParams);
        }));
        it('should resolve BuyersList', inject(function($injector, Parameters) {
            $injector.invoke(state.resolve.BuyerList);
            expect(oc.Buyers.List).toHaveBeenCalledWith(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
        }));
    });

    xdescribe('State: buyers.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('buyers.edit');
            spyOn(oc.Buyers, 'Get');
        }));
        it('should resolve SelectedBuyer', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedBuyer);
            expect(oc.Buyers.Get).toHaveBeenCalledWith($stateParams.buyerid);
        }));
    });

    xdescribe('State: buyers.details', function(){
        var state;
        beforeEach(inject(function($state){
            state = $state.get('buyers.details');
            spyOn(oc.Buyers, 'Get');
        }));
        it('should resolve SelectedBuyer', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.SelectedBuyer);
            expect(oc.Buyers.Get).toHaveBeenCalledWith($stateParams.buyerid);
        }));
    });

    xdescribe('Controller: BuyerCtrl', function() {
        var buyerCtrl,
            parameters,
            buyerList;
        beforeEach(inject(function($state, $controller, Parameters) {
            parameters = Parameters;
            buyerCtrl = $controller('BuyerCtrl', {
                Parameters: parameters,
                BuyerList: buyerList
            });
            spyOn($state, 'go');
        }));
        describe('filter', function() {
            it('should refresh the page with the filter parameters', inject(function($state, ocParameters) {
                buyerCtrl.filter();
                expect($state.go).toHaveBeenCalledWith('.', ocParameters.Create(parameters));
            }));
        });
        describe('search', function() {
            beforeEach(function() {
                spyOn(buyerCtrl, 'filter');
            });
            it('should call the filter method', function() {
                buyerCtrl.search();
                expect(buyerCtrl.filter).toHaveBeenCalledWith(true);
            })
        });
        describe('clearSearch', function() {
            beforeEach(function() {
                spyOn(buyerCtrl, 'filter');
                buyerCtrl.parameters.search = null;
            });
            it('should call the filter method with search parameters set to null', function() {
                buyerCtrl.clearSearch();
                expect(buyerCtrl.filter).toHaveBeenCalledWith(true);
            })
        });
        describe('clearFilters', function() {
            beforeEach(function() {
                spyOn(buyerCtrl, 'filter');
                buyerCtrl.parameters.filters = null;
            });
            it('should call the filter method with filter parameters set to null', function(){
                buyerCtrl.clearFilters();
                expect(buyerCtrl.filter).toHaveBeenCalledWith(true);
            })
        });
        describe('updateSort', function() {
            beforeEach(function() {
                spyOn(buyerCtrl, 'filter');
            });
            it('should call the filter method', function() {
                buyerCtrl.updateSort();
                expect(buyerCtrl.filter).toHaveBeenCalledWith(false);
            })
        });
        describe('pageChanged', function() {
            beforeEach(function(){
                buyerCtrl.list = {
                    Meta: {
                        Page: '',
                        PageSize: ''
                    }
                };
            });
            it('should go to the specified page', inject(function($state) {
                buyerCtrl.pageChanged();
                expect($state.go).toHaveBeenCalledWith('.',{page: buyerCtrl.list.Meta.Page});
            }));
        });
        describe('loadMore', function() {
            beforeEach(function() {
                var defer = q.defer();
                buyerCtrl.list = {
                    Meta: {
                        Page: '',
                        PageSize: ''
                    },
                    Items: {}
                };
                defer.resolve(buyerCtrl.list);
                buyerCtrl.buyerList = buyerList;
                spyOn(oc.Buyers, 'List').and.returnValue(defer.promise);
            });
            it('should call the loadMore method', inject(function(Parameters) {
                buyerCtrl.loadMore();
                expect(oc.Buyers.List).toHaveBeenCalledWith(Parameters.search, buyerCtrl.list.Meta.Page + 1, Parameters.pageSize || buyerCtrl.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            }))
        })
    });

    xdescribe('Controller: BuyerEditCtrl', function() {
        var buyerEditCtrl,
            toaster;
        beforeEach(inject(function($state, $controller, toastr) {
            toaster = toastr;
            buyerEditCtrl = $controller('BuyerEditCtrl', {
                $scope: scope,
                SelectedBuyer: buyer,
                toastr: toaster
            });
            spyOn($state, 'go');
        }));

        describe('Submit', function() {
            beforeEach(function() {
                buyerEditCtrl.buyer = buyer;
                var defer = q.defer();
                defer.resolve(buyer);
                spyOn(oc.Buyers, 'Update').and.returnValue(defer.promise);
                spyOn(toaster, 'success');
                buyerEditCtrl.Submit();
                scope.$digest();
            });
            it('should call the Buyers Update method', function() {
                expect(oc.Buyers.Update).toHaveBeenCalledWith(buyerEditCtrl.buyer, buyerEditCtrl.buyer.ID);
            });
            it('should enter the buyers state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('buyers', {}, {reload: true});
            }));
            it('should display success toastr upon success', function() {
                expect(toaster.success).toHaveBeenCalledWith('Buyer Updated');
            })
        });
    });

    xdescribe('Controller: BuyerCreateCtrl', function() {
        var buyerCreateCtrl,
            toaster;
        beforeEach(inject(function($state, $controller, toastr) {
            toaster = toastr;
            buyerCreateCtrl = $controller('BuyerCreateCtrl', {
                $scope: scope,
                toastr: toaster
            });
            spyOn($state, 'go');
        }));

        describe('Submit', function() {
            beforeEach(function() {
                buyerCreateCtrl.buyer = buyer;
                var defer = q.defer();
                defer.resolve(buyer);
                spyOn(oc.Buyers, 'Create').and.returnValue(defer.promise);
                spyOn(toaster, 'success');
                buyerCreateCtrl.Submit();
                scope.$digest();
            });
            it('should call the Buyers Create method', function() {
                expect(oc.Buyers.Create).toHaveBeenCalledWith(buyer);
            });
            it('should enter the buyers state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('buyers', {}, {reload: true});
            }));
            it('should display toastr success upon success', function() {
                expect(toaster.success).toHaveBeenCalledWith('Buyer Created');
            })
        });
    });
});

