describe('Component: Category Facets', function() {
   var scope,
       q,
       category,
       matchingProds,
       modalInstance,
       oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        category = {
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
        matchingProds = {
          Meta: {},
            Items: [
                {
                    ID: 'prod123465789',
                    xp: {
                        OC_Facets: {
                            TestCategory123456789: {
                                color: ['blue']
                            }
                        }
                    }
                }
            ]

        };
        modalInstance = {
            close: jasmine.createSpy('modalInstance.close'),
            dismiss: jasmine.createSpy('modalInstance.dismiss'),
            result: {
                then: jasmine.createSpy('modalInstance.result.then')
            }
        };
        oc = OrderCloud;
    }));
    describe('State: categoryFacets', function() {
       var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('categoryFacets');
            spyOn(oc.Categories, 'List').and.returnValue(null);
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve CategoryList', inject(function($injector) {
            $injector.invoke(state.resolve.CategoryList);
            expect(oc.Categories.List).toHaveBeenCalledWith(null, null, 12, null, null, undefined);
        }));
    });
    describe('State: categoryFacets.manage', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('categoryFacets.manage')
            spyOn(oc.Categories, 'Get').and.returnValue(null);
        }));
        it('should resolve Category', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.Category);
            expect(oc.Categories.Get).toHaveBeenCalledWith($stateParams.categoryid);
        }));
    });
    describe('Controller: FacetedCategoryManageController', function() {
        var facetedCategoryManageCtrl;
        beforeEach(inject(function($controller) {
            facetedCategoryManageCtrl = $controller('CategoryFacetsManageCtrl', {
                $scope: scope,
                Category: category
            });
            facetedCategoryManageCtrl.facetName = 'color'
        }));
        //TODO: Figure out how to mock  modal.result.then
        xdescribe('createFacetModal', function() {
            beforeEach(function() {
               var dfd  = q.defer();
               dfd.resolve();
                spyOn(oc.Categories, 'Update').and.returnValue(dfd.promise);
                facetedCategoryManageCtrl.createFacetModal();
           });
            it('should call the Categories Update method', function() {
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
            });
        });
        describe('addValueExisting', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(category);
                facetedCategoryManageCtrl.color = {
                    newFacetValue: 'Purple'
                };
                spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
                facetedCategoryManageCtrl.addValueExisting(facetedCategoryManageCtrl.facetName, 1);
                scope.$digest();
            });
            it('should call the Categories Update method and add purple to the values', function() {
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.Values[3]).toEqual('purple');
                expect(category.xp.OC_Facets.color.Values.length).toEqual(4);
            });
        });
        describe('removeValueExisting', function() {
            beforeEach(function() {
                spyOn(oc.Categories, 'Update').and.returnValue(null);
                facetedCategoryManageCtrl.removeValueExisting(facetedCategoryManageCtrl.facetName, 3);
            });
            it('should call the Categories Update method and remove blue from the values', function() {
                category.xp.OC_Facets.color.Values.splice(2, 1);
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.Values.indexOf('blue')).toEqual(-1);
                expect(category.xp.OC_Facets.color.Values.length).toEqual(2);
            });
        });
        describe('toggleFacetRequired', function() {
            beforeEach(function() {
                spyOn(oc.Categories, 'Update').and.returnValue(null);
                facetedCategoryManageCtrl.toggleFacetRequired(facetedCategoryManageCtrl.facetName);
            });
            it('should call the Categories Update method and toggle isRequired to true', function() {
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.isRequired).toEqual(true);
            });
            it('should call the Categories Update method and toggle isRequired to false', function() {
                facetedCategoryManageCtrl.toggleFacetRequired(facetedCategoryManageCtrl.facetName);
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
                expect(category.xp.OC_Facets.color.isRequired).toEqual(false);
            });
        });
        describe('deleteFacet', function() {
           beforeEach(function() {
               var defer = q.defer();
               defer.resolve();
               var proddfd = q.defer();
               proddfd.resolve(matchingProds);
               spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
               spyOn(oc.Products, 'List').and.returnValue(proddfd.promise);
               spyOn(oc.Products, 'Update').and.returnValue(null);
               spyOn(window, 'confirm').and.returnValue(true);
               facetedCategoryManageCtrl.deleteFacet(facetedCategoryManageCtrl.facetName);
               scope.$digest();
           });
            it('should call Categories Update method', function() {
                delete category.xp.OC_Facets.color;
                expect(oc.Categories.Update).toHaveBeenCalledWith(category.ID, category);
            });
            it('should call the Products List method with the filterObj', function() {
                var keyName = 'xp.OC_Facets.TestCategory123456789.color';
                var filterObj = {};
                filterObj[keyName] = '*';
                expect(oc.Products.List).toHaveBeenCalledWith(null, 1, 100, null, null, filterObj);
            });
            it('should call the Products Update method', function() {
                delete matchingProds.Items[0].xp.OC_Facets.TestCategory123456789;
                expect(oc.Products.Update).toHaveBeenCalledWith(matchingProds.Items[0].ID, matchingProds.Items[0]);
                expect(oc.Products.Update.calls.count()).toEqual(1);
            });
        });
    });
    describe('CategoryFacetsModalController', function() {
        var categoryFacetsModalCtrl;
        beforeEach(inject(function($controller) {
            categoryFacetsModalCtrl = $controller('CategoryFacetsModalCtrl', {
                $scope: scope,
                $uibModalInstance: modalInstance
            });
            categoryFacetsModalCtrl.facet = 'Brand';
            categoryFacetsModalCtrl.facetValues = ['nike', 'vans'];
            categoryFacetsModalCtrl.facetValue = 'TOMS';
        }));
        describe('addValue', function() {
           beforeEach(function() {
               categoryFacetsModalCtrl.addValue();
           });
            it('should push the facetValue to the facetValues array', function() {
                expect(categoryFacetsModalCtrl.facetValues.length).toEqual(3);
                expect(categoryFacetsModalCtrl.facetValues[2]).toEqual('TOMS');
                expect(categoryFacetsModalCtrl.facetValue).toEqual(null);
            })
        });
        describe('removeValue', function() {
            beforeEach(function() {
                categoryFacetsModalCtrl.removeValue(1);
            });
            it('should splice the facetValue from the facetValues array', function() {
                expect(categoryFacetsModalCtrl.facetValues.length).toEqual(1);
                expect(categoryFacetsModalCtrl.facetValues.indexOf('vans')).toEqual(-1);
            })
        });
        describe('save', function() {
            var facetToSave = {
                facet: 'Brand',
                facetValues: ['nike', 'vans'],
                isRequired: false
            };
            beforeEach(function() {
                categoryFacetsModalCtrl.save();
            });
            it('should call modalInstance close method', inject(function() {
                expect(modalInstance.close).toHaveBeenCalledWith(facetToSave);
            }));
        });
        describe('cancel', function() {
            beforeEach(function() {
                categoryFacetsModalCtrl.cancel();
            });
            it('should call modalInstance dismiss method', function() {
                expect(modalInstance.dismiss).toHaveBeenCalledWith('cancel');
            })
        });
    });
});