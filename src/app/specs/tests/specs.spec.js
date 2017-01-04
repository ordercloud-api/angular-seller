describe('Component: Specs', function() {
    var scope,
        q,
        spec,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud', function($provide){
        $provide.value('SelectedOpts', {});
    }));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        spec = {
            ID: "TestSpec123456789",
            Name: "TestSpecTest",
            ListOrder: 1,
            Required: false,
            DefinesVariant: false,
            AllowOpenText: false,
            DefaultOptionID: null,
            Options: [
                {
                    ID: "TestSpecOpt123456789",
                    Value: "1",
                    ListOrder: 0,
                    IsOpenText: false,
                    PriceMarkupType: null,
                    PriceMarkup: null
                }
            ]
        };
        oc = OrderCloud;
    }));

    describe('State: specs', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('specs');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Specs, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve SpecList', inject(function($injector) {
            $injector.invoke(state.resolve.SpecList);
            expect(oc.Specs.List).toHaveBeenCalled();
        }));
    });

    describe('State: specs.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('specs.edit');
            spyOn(oc.Specs, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedSpec', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedSpec);
            expect(oc.Specs.Get).toHaveBeenCalledWith($stateParams.specid);
        }));
    });

    describe('State: specs.assign', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('specs.assign');
            spyOn(oc.Products, 'List').and.returnValue(null);
            spyOn(oc.Specs, 'ListProductAssignments').and.returnValue(null);
            spyOn(oc.Specs, 'Get').and.returnValue(null);
        }));
        it('should resolve ProductList', inject(function($injector) {
            $injector.invoke(state.resolve.ProductList);
            expect(oc.Products.List).toHaveBeenCalledWith(null, 1, 20);
        }));
        it('should resolve ProductAssignments', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.ProductAssignments);
            expect(oc.Specs.ListProductAssignments).toHaveBeenCalledWith($stateParams.specid);
        }));
        it('should resolve SelectedSpec', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedSpec);
            expect(oc.Specs.Get).toHaveBeenCalledWith($stateParams.specid);
        }));
    });

    describe('Controller: SpecEditCtrl', function() {
        var specEditCtrl;
        beforeEach(inject(function($state, $controller) {
            specEditCtrl = $controller('SpecEditCtrl', {
                $scope: scope,
                SelectedSpec: spec
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('addSpecOpt', function() {
            beforeEach(function() {
                specEditCtrl.spec = spec;
                specEditCtrl.specID = "TestSpec123456789";
                specEditCtrl.Option = {
                    ID: "TestSpecOpt123456789",
                    Value: "test"
                };
                specEditCtrl.Options = [
                    {
                        ID: "TestSpecOpt1234567890",
                        Value: "test"
                    },
                    {
                        ID: "TestSpecOpt123456789123",
                        Value: "test"
                    }
                ];
                var defer = q.defer();
                defer.resolve(spec);
                spyOn(oc.Specs, 'CreateOption').and.returnValue(defer.promise);
                specEditCtrl.DefaultOptionID = true;
                specEditCtrl.addSpecOpt();
            });
            it ('should call the Specs CreateOption method', function() {
                expect(oc.Specs.CreateOption).toHaveBeenCalledWith(specEditCtrl.specID, specEditCtrl.Option);
            });
            it ('should set specEditCtrl.spec.DefaultOption ID to specEditCtrl.Option.ID', inject(function() {
                expect(spec.DefaultOptionID).toEqual(specEditCtrl.Option.ID);
            }));
            it ('should set specEditCtrl.Option to null', inject(function() {
                scope.$digest();
                expect(specEditCtrl.Option).toEqual(null);
            }));
        });

        describe('deleteSpecOpt', function() {
            beforeEach(function() {
                specEditCtrl.spec = spec;
                specEditCtrl.specID = "TestSpec123456789";
                //specEditCtrl.spec.DefaultOptionID = specEditCtrl.spec.Options[0].ID;
                specEditCtrl.Options = [
                    {
                        ID: "TestSpecOpt123456789",
                        Value: "test"
                    },
                    {
                        ID: "TestSpecOpt123456789123",
                        Value: "test"
                    }
                ];
                var index = 0;
                spyOn(oc.Specs, 'DeleteOption').and.returnValue(null);
                specEditCtrl.deleteSpecOpt(index);
            });
            it ('should splice the option from the Spec Options array', inject(function() {
                expect(specEditCtrl.Options.length).toEqual(2);
            }));
            it ('should call the Specs DeleteOption method', function() {
                expect(oc.Specs.DeleteOption).toHaveBeenCalledWith(specEditCtrl.specID, specEditCtrl.spec.Options[0].ID);
            });
            it ('should set DefaultOptionID to null because the deleted Option was set as Default', inject(function() {
                expect(specEditCtrl.spec.DefaultOptionID).toEqual(null);
            }));
        });

        describe('Submit', function() {
            beforeEach(function() {
                specEditCtrl.spec = spec;
                specEditCtrl.specID = "TestSpec123456789";
                var defer = q.defer();
                defer.resolve(spec);
                spyOn(oc.Specs, 'Update').and.returnValue(defer.promise);
                specEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Specs Update method', function() {
                expect(oc.Specs.Update).toHaveBeenCalledWith(specEditCtrl.specID, specEditCtrl.spec);
            });
            it ('should enter the specs state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('specs', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(spec);
                spyOn(oc.Specs, 'Delete').and.returnValue(defer.promise);
                specEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Specs Delete method', function() {
                expect(oc.Specs.Delete).toHaveBeenCalledWith(spec.ID);
            });
            it ('should enter the specs state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('specs', {}, {reload: true});
            }));
        });
    });

    describe('Controller: SpecCreateCtrl', function() {
        var specCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            specCreateCtrl = $controller('SpecCreateCtrl', {
                $scope: scope,
                Option: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));
        describe('addSpecOpt', function() {
            beforeEach(inject(function() {
                specCreateCtrl.spec = spec;
                specCreateCtrl.Option = {
                    ID: 'specID'
                };
                specCreateCtrl.addSpecOpt();
            }));
            it ('should push the option to the Spec Options array', function() {
                expect(specCreateCtrl.Options.length).toEqual(1);
            });
            it ('should set specCreateCtrl.Option to null', function() {
                expect(specCreateCtrl.Option).toEqual(null);
            });
            it ('should set specCreateCtrl.DefaultOptionID to null', function() {
                expect(specCreateCtrl.DefaultOptionID).toEqual(null);
            });

        });
        describe('deleteSpecOpt', function() {
            beforeEach(inject(function() {
                specCreateCtrl.spec = spec;
                specCreateCtrl.specID = "TestSpec123456789";
                specCreateCtrl.spec.DefaultOptionID = specCreateCtrl.spec.Options[0].ID;
                specCreateCtrl.Options = [
                    {
                        ID: "TestSpecOpt123456789",
                        Value: "test"
                    },
                    {
                        ID: "TestSpecOpt123456789123",
                        Value: "test"
                    }
                ];
                var index = 0;
                specCreateCtrl.deleteSpecOpt(index);
            }));
            it ('should splice the option from the Spec Options array', function() {
                expect(specCreateCtrl.Options.length).toEqual(1);
            });
            it ('should set DefaultOptionID to null because the deleted Option was set as Default', function() {
                expect(specCreateCtrl.spec.DefaultOptionID).toEqual(null);
            });
        });
        describe('Submit', function() {
            beforeEach(function() {
                specCreateCtrl.spec = spec;
                specCreateCtrl.specID = "TestSpec123456789";
                specCreateCtrl.Options = [
                    {
                        ID: "TestSpecOpt123456789",
                        Value: "test"
                    },
                    {
                        ID: "TestSpecOpt123456789123",
                        Value: "test"
                    }
                ];
                var defer = q.defer();
                defer.resolve(spec);
                spyOn(oc.Specs, 'Create').and.returnValue(defer.promise);
                spyOn(oc.Specs, 'CreateOption').and.returnValue(defer.promise);
                specCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Specs Create method', function() {
                expect(oc.Specs.Create).toHaveBeenCalledWith(spec);
            });
            it ('should call the Specs CreateOption method', function() {
                expect(oc.Specs.CreateOption).toHaveBeenCalledWith(specCreateCtrl.specID, specCreateCtrl.Options[0]);
            });
            it ('should call the Specs CreateOption method', function() {
                expect(oc.Specs.CreateOption).toHaveBeenCalledWith(specCreateCtrl.specID, specCreateCtrl.Options[1]);
            });
            it ('should enter the specs state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('specs', {}, {reload: true});
            }));
        });
    });
    
    describe('Controller: SpecAssignCtrl', function() {
        var specAssignCtrl,
            assignments;
        beforeEach(inject(function($state, $controller, Assignments) {
            assignments = Assignments;
            specAssignCtrl = $controller('SpecAssignCtrl', {
                $scope: scope,
                ProductList: [],
                ProductAssignments: [],
                SelectedSpec: {},
                Assignments: assignments
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function() {
                spyOn(assignments, 'SaveAssignments').and.returnValue(null);
                specAssignCtrl.saveAssignments();
            }));
            it ('should call the saveAssignments method', inject(function() {
                expect(assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                spyOn(Paging, 'Paging').and.returnValue(null);
                specAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    });
});

