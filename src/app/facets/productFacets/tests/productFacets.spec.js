describe('Component: Product Facets', function() {
    var scope,
        q,
        assignedCategory,
        categoryList,
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
        categoryList = {
            Meta: {},
            Items: [
                {
                    ID: "TestCategory123456789",
                    Name: "TestCategoryTest",
                    Description: "Test Category Description",
                    ListOrder: 1,
                    Active: true,
                    xp: {
                        OC_Facets: {
                            size: {
                                Values: ['s', 'm', 'l'],
                                isRequired: true
                            },
                            color: {
                                Values: ['red', 'green', 'blue'],
                                isRequired: false
                            }
                        }
                    }
                }
            ]
        };
        assignedCategory =
            {
                ID: "TestCategory123456789",
                Name: "TestCategoryTest",
                Description: "Test Category Description",
                ListOrder: 1,
                Active: true,
                xp: {
                    OC_Facets: {
                        size: {
                            Values: ['s', 'm', 'l'],
                            isRequired: true
                        },
                        color: {
                            Values: ['red', 'green', 'blue'],
                            isRequired: false
                        }
                    }
                }
            };
        product = {
            ID: 'TestProd123456789',
            xp: {
                OC_Facets: {
                    TestCategory123456789: {
                        color: ['blue'],
                        size: []
                    }
                }
            }
        };
        oc = OrderCloud;
    }));
    describe('State: productFacets', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('productFacets');
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
    describe('State: productFacets.manage', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('productFacets.manage');
            spyOn(oc.Products, 'Get').and.returnValue(null);
            var dfd = q.defer();
            dfd.resolve(categoryList);
            spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(dfd.promise);
        }));
        it('should resolve Product', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.Product);
            expect(oc.Products.Get).toHaveBeenCalledWith($stateParams.productid);
        }));
        it('should resolve AssignedCategories', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedCategories);
            expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(null, $stateParams.productid);
        }));
    });
    describe('Controller: FacetedProductManageController', function() {
        var facetedProductManageCtrl;
        var facetName = 'color';
        beforeEach(inject(function($controller) {
            facetedProductManageCtrl = $controller('ProductFacetsManageCtrl', {
                $scope: scope,
                Product: product,
                AssignedCategories: assignedCategory
            });
            facetedProductManageCtrl.newFacetValue = 'purple';

        }));
        describe('setSelected', function() {
            it('should return true', function() {
               expect(facetedProductManageCtrl.setSelected(assignedCategory, 'color', 'blue')).toEqual(true);
            });
            it('should return false', function() {
                expect(facetedProductManageCtrl.setSelected(assignedCategory, 'color', 'red')).toEqual(false);
            });
        });
        describe('toggleSelection', function() {
            beforeEach(function() {
                facetedProductManageCtrl.toggleSelection(assignedCategory, 'color', 'blue');
                facetedProductManageCtrl.toggleSelection(assignedCategory, 'color', 'red');
            });
            it('should set selected to false',function() {
                expect(facetedProductManageCtrl.setSelected(assignedCategory, 'color', 'blue')).toEqual(false);
            });
            it('should set selected to true',function() {
                expect(facetedProductManageCtrl.setSelected(assignedCategory, 'color', 'red')).toEqual(true);
            });
        });
        describe('requiredFacet', function() {
            beforeEach(function() {
                facetedProductManageCtrl.requiredFacet(assignedCategory);
           });
            it('should return true', function() {
                expect(facetedProductManageCtrl.requiredFacet(assignedCategory)).toEqual(true);
            })
        });
        describe('saveSelections', function() {
           beforeEach(inject(function($state) {
               var defer = q.defer();
               defer.resolve();
               spyOn(oc.Products, 'Update').and.returnValue(defer.promise);
               spyOn($state, 'go').and.returnValue(null);
               facetedProductManageCtrl.saveSelections();
               scope.$digest();
           }));
            it('should call the Products Update method', function() {
               expect(oc.Products.Update).toHaveBeenCalledWith(product.ID, product);
            });
            it('should reload the state', inject(function($state) {
               expect($state.go).toHaveBeenCalledWith($state.current, {}, {reload: true});
            }));
        });
        describe('addValueExisting', function() {
            beforeEach(inject(function($state) {
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
                spyOn(oc.Products, 'Update').and.returnValue(defer.promise);
                spyOn($state, 'go').and.returnValue(null);
                facetedProductManageCtrl.newFacetValue = {
                    color: 'purple'
                };
                facetedProductManageCtrl.addValueExisting(assignedCategory, facetName);
                scope.$digest();
            }));
            it('should call the Products Update method and add purple to the values', function() {
                expect(oc.Products.Update).toHaveBeenCalledWith(product.ID, product);
                expect(product.xp.OC_Facets.TestCategory123456789.color[1]).toEqual('purple');
                expect(product.xp.OC_Facets.TestCategory123456789.color.length).toEqual(2);
            });
        });
    });
});