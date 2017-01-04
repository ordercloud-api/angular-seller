describe('Component: Products', function() {
    var scope,
        q,
        product,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        product = {
            ID: "TestProduct123456789",
            Name: "TestProductTest",
            Description: "Test Product Description",
            QuantityMultiplier: 1,
            ShipWeight: 1,
            Active: true,
            Type: "Static",
            InventoryEnabled: false,
            InventoryNotificationPoint: null,
            VariantLevelInventory: false,
            AllowOrderExceedInventory: false,
            DisplayInventory: false
        };
        oc = OrderCloud;
    }));

    describe('State: products', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('products', {}, {reload: true});
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Products, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve ProductList', inject(function($injector) {
            $injector.invoke(state.resolve.ProductList);
            expect(oc.Products.List).toHaveBeenCalled();
        }));
    });

    describe('State: products.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('products.edit', {}, {reload: true});
            spyOn(oc.Products, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedProduct', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedProduct);
            expect(oc.Products.Get).toHaveBeenCalledWith($stateParams.productid);
        }));
    });

    describe('State: products.assignments', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('products.assignments', {}, {reload: true});
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Products, 'ListAssignments').and.returnValue(null);
            spyOn(oc.Products, 'Get').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, $stateParams, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve Assignments', inject(function($injector, $stateParams, Parameters) {
            $injector.invoke(state.resolve.Assignments);
            expect(oc.Products.ListAssignments).toHaveBeenCalledWith($stateParams.productid, Parameters.productID, Parameters.userID, Parameters.userGroupID, Parameters.level, Parameters.priceScheduleID, Parameters.page, Parameters.pageSize);
        }));
        it('should resolve SelectedProduct', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedProduct);
            expect(oc.Products.Get).toHaveBeenCalledWith($stateParams.productid);
        }));
    });

    describe('State: products.createAssignment', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('products.createAssignment', {}, {reload: true});
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.PriceSchedules, 'List').and.returnValue(null);
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve PriceScheduleList', inject(function($injector) {
            $injector.invoke(state.resolve.PriceScheduleList);
            expect(oc.PriceSchedules.List).toHaveBeenCalled();
        }));
    });

    describe('Controller: ProductEditCtrl', function() {
        var productEditCtrl;
        beforeEach(inject(function($state, $controller) {
            productEditCtrl = $controller('ProductEditCtrl', {
                $scope: scope,
                SelectedProduct: product
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                productEditCtrl.product = product;
                productEditCtrl.productID = "TestProduct123456789";
                var defer = q.defer();
                defer.resolve(product);
                spyOn(oc.Products, 'Update').and.returnValue(defer.promise);
                productEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Products Update method', function() {
                expect(oc.Products.Update).toHaveBeenCalledWith(productEditCtrl.productID, productEditCtrl.product);
            });
            it ('should enter the products state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('products', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(product);
                spyOn(oc.Products, 'Delete').and.returnValue(defer.promise);
                productEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Products Delete method', function() {
                expect(oc.Products.Delete).toHaveBeenCalledWith(product.ID);
            });
            it ('should enter the products state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('products', {}, {reload: true});
            }));
        });
    });

    describe('Controller: ProductCreateCtrl', function() {
        var productCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            productCreateCtrl = $controller('ProductCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                productCreateCtrl.product = product;
                var defer = q.defer();
                defer.resolve(product);
                spyOn(oc.Products, 'Create').and.returnValue(defer.promise);
                productCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Products Create method', function() {
                expect(oc.Products.Create).toHaveBeenCalledWith(product);
            });
            it ('should enter the products state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('products', {}, {reload: true});
            }));
        });
    });

    describe('Controller: ProductAssignmentsCtrl', function() {
        var productAssignmentsCtrl;
        beforeEach(inject(function($state, $controller) {
            productAssignmentsCtrl = $controller('ProductAssignmentsCtrl', {
                $scope: scope,
                SelectedProduct: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Delete', function() {
            beforeEach(function() {
                scope.assignment = {
                    UserGroupID: '42'
                };
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Products, 'DeleteAssignment').and.returnValue(defer.promise);
                productAssignmentsCtrl.Delete(scope);
            });
            it ('should call the Product DeleteAssignment method', inject(function($stateParams) {
                expect(oc.Products.DeleteAssignment).toHaveBeenCalledWith($stateParams.productid, null, scope.assignment.UserGroupID);
            }));
        });
    });

    describe('Controller: ProductCreateAssignmentCtrl', function() {
        var productCreateAssignmentCtrl;
        beforeEach(inject(function($state, $controller) {
            productCreateAssignmentCtrl = $controller('ProductCreateAssignmentCtrl', {
                $scope: scope,
                UserGroupList: [],
                PriceScheduleList: []
        });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('toggleReplenishmentPS', function() {
            beforeEach(inject(function() {
            productCreateAssignmentCtrl.model= {
                ReplenishmentPriceScheduleID: null
            };
                productCreateAssignmentCtrl.toggleReplenishmentPS(productCreateAssignmentCtrl.model.ReplenishmentPriceScheduleID);

            }));
            it ('should call toggleReplenishmentPS method', function() {
                expect(productCreateAssignmentCtrl.model.ReplenishmentPriceScheduleID).toBe(null);
            });
        });

        describe('toggleStandardPS', function() {
            beforeEach(inject(function() {
                var id = "TestPriceSchedule123456789";
                productCreateAssignmentCtrl.model= {
                   StandardPriceScheduleID: "TestPriceSchedule123456789"
                };
                productCreateAssignmentCtrl.toggleStandardPS(id);

            }));
            it ('should call toggleReplenishmentPS method', function() {
                expect(productCreateAssignmentCtrl.model.StandardPriceScheduleID).toBe("TestPriceSchedule123456789");
            });
        });

        describe('submit', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Products, 'SaveAssignment').and.returnValue(defer.promise);
                productCreateAssignmentCtrl.model= {
                    ProductID: "TestProduct123456789",
                    BuyerID: "TestBuyer123456789",
                    UserGroupID: "TestUserGroup123456789",
                    StandardPriceScheduleID: "TestPriceSchedule123456789"
                };
                productCreateAssignmentCtrl.submit();
            });

            it ('should call the Product SaveAssignment method', function() {
                productCreateAssignmentCtrl.assignBuyer = true;
                expect(oc.Products.SaveAssignment).toHaveBeenCalledWith(productCreateAssignmentCtrl.model);
            });
        });
    });
});

