describe('Component: Catalogs', function(){
    var scope,
        rootScope,
        q,
        oc,
        catalog,
        catalogViewManagement,
        categoryModalFactory;
    beforeEach(module(function($provide){
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, $q, OrderCloud, CatalogViewManagement, CategoryModalFactory){
        scope = $rootScope.$new();
        rootScope = $rootScope;
        q = $q;
        oc = OrderCloud;
        catalog = {
            ID: 'CatalogID',
            Name: 'CatalogName'
        };
        catalogViewManagement = CatalogViewManagement;
        categoryModalFactory = CategoryModalFactory;
    }));

    describe('State: catalogs', function(){
        var state;
        beforeEach(inject(function($state, OrderCloudParameters){
            state = $state.get('catalogs', {}, {reload: true});
            spyOn(OrderCloudParameters, 'Get');
            spyOn(oc.Catalogs, 'List');
            spyOn(oc.Buyers, 'List');
        }));
        it('should resolve Parameters', inject(function($injector, $stateParams, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalledWith($stateParams);
        }));
        it('should resolve CatalogsList', inject(function($injector, Parameters){
            $injector.invoke(state.resolve.CatalogsList);
            expect(oc.Catalogs.List).toHaveBeenCalledWith(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy);
        }));
        it('should resolve BuyersList', inject(function($injector, Parameters){
            $injector.invoke(state.resolve.BuyersList);
            expect(oc.Buyers.List).toHaveBeenCalledWith(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy)
        }))
    });

    describe('State: catalogs.edit', function(){
        var state;
        beforeEach(inject(function($state, CategoryTreeService){
            state = $state.get('catalogs.edit');
            spyOn(CategoryTreeService, 'GetCategoryTree');
        }));
        it('should resolve Tree', inject(function($injector, $stateParams, CategoryTreeService){
            $injector.invoke(state.views[""].resolve.Tree);
            expect(CategoryTreeService.GetCategoryTree).toHaveBeenCalledWith($stateParams.catalogid)
        }))
    });

    describe('Controller: CatalogsCtrl', function(){
        var catalogsCtrl,
            parameters,
            categoryList;
        beforeEach(inject(function($state, $controller, Parameters){
            parameters = Parameters;
            catalogsCtrl = $controller('CatalogsCtrl', {
                Parameters: parameters,
                CatalogsList: categoryList,
                resetPage: {}
            });
            spyOn($state, 'go');
        }));
        describe('filter', function(){
            it('should refresh the page with the the filter parameters', inject(function($state, OrderCloudParameters){
                catalogsCtrl.filter();
                expect($state.go).toHaveBeenCalledWith('.', OrderCloudParameters.Create(parameters))
            }));
        });
        describe('search', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.search();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(true);
            })
        });
        describe('clearSearch', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.clearSearch();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(true);
            })
        });
        describe('clearFilters', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.clearFilters();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(true);
            })
        });
        describe('updateSort', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.updateSort();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(false);
            })
        });
        describe('pageChanged', function(){
            beforeEach(function(){
                catalogsCtrl.list = {
                    Meta: {
                        Page: '',
                        PageSize: ''
                    }
                };
            });
            it('should go to the specified page', inject(function($state){
                catalogsCtrl.pageChanged();
                expect($state.go).toHaveBeenCalledWith('.',{page: catalogsCtrl.list.Meta.Page});
            }));
        });
        describe('loadMore', function(){
            beforeEach(function(){
                var defer = q.defer();
                catalogsCtrl.list = {
                    Meta: {
                        Page: '',
                        PageSize: ''
                    },
                    Items: {}
                };
                defer.resolve(catalogsCtrl.list);
                catalogsCtrl.categoryList = categoryList;
                spyOn(oc.Catalogs, 'List').and.returnValue(defer.promise);
            });
            it('should call the loadMore method', inject(function(Parameters){
                catalogsCtrl.loadMore();
                expect(oc.Catalogs.List).toHaveBeenCalledWith(Parameters.search, catalogsCtrl.list.Meta.Page + 1, Parameters.pageSize || catalogsCtrl.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
            }));
        })
    });

    describe('Controller: CatalogCreateCtrl', function(){
        var catalogCreateCtrl,
            toaster;
        beforeEach(inject(function($state, $controller, toastr){
            toaster = toastr;
            catalogCreateCtrl = $controller('CatalogCreateCtrl', {
                $scope: scope,
                toastr: toaster
            });
            spyOn($state, 'go');
        }));
        describe('saveCatalog', function(){
            beforeEach(function(){
                catalogCreateCtrl.catalog = catalog;
                var defer = q.defer();
                defer.resolve(catalog);
                spyOn(oc.Catalogs, 'Create').and.returnValue(defer.promise);
                spyOn(toaster, 'success');
                catalogCreateCtrl.saveCatalog();
                scope.$digest();
            });
            it('should call the Catalogs Create method', function(){
                expect(oc.Catalogs.Create).toHaveBeenCalledWith(catalog);
            });
            it('should display success toastr upon success', function(){
                expect(toaster.success).toHaveBeenCalledWith('Catalog Created', 'Success');
            });
            it('should enter the catalogs state and reload the state', inject(function($state){
                expect($state.go).toHaveBeenCalledWith('catalogs', {catalogid: catalogCreateCtrl.catalog.ID, fromstate: "catalogCreate"}, {reload: true});
            }))
        })
    });

    describe('Controller: CatalogTreeCtrl', function(){
        var catalogTreeCtrl;
        beforeEach(inject(function($controller, Tree){
            catalogTreeCtrl = $controller('CatalogTreeCtrl', {
                selectedCategory: {}
            });
            catalogTreeCtrl.tree = Tree;
            catalogTreeCtrl.selectedCategory = {};
        }));
        describe('categorySelected', function(){
            beforeEach(inject(function(){
                spyOn(catalogViewManagement, 'SetCategoryID');
                catalogTreeCtrl.categorySelected('category');
            }));
            it('should call the SetCategoryID method on catalogViewManagement', function(){
                expect(catalogViewManagement.SetCategoryID).toHaveBeenCalledWith('category');
            })
        });
        describe('createCategory', function(){
            beforeEach(inject(function(){
                spyOn(categoryModalFactory, 'Create');
                catalogTreeCtrl.createCategory('parentid');
            }));
            it('should call the Create method on categoryModalFactory', function(){
                expect(categoryModalFactory.Create).toHaveBeenCalledWith('parentid')
            })
        })
    });

    describe('Controller: CatalogAssignmentsCtrl', function(){
        var catalogAssignmentsCtrl;
        beforeEach(inject(function($controller){
            catalogAssignmentsCtrl = $controller('CatalogAssignmentsCtrl', {
                categoryid: null
            });
        }));
        describe('getAssignments', function(){
            beforeEach(function(){
                var defer = q.defer();
                catalogAssignmentsCtrl.assignments = {};
                catalogAssignmentsCtrl.categoryid = 'categoryID';
                defer.resolve();
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CatalogIDChanged', '123');
            });
            it('should call the ListAssignments method on OrderCloud Categories', function(){
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(catalogAssignmentsCtrl.categoryid);
            })
        });
        describe('getProducts', function(){
            beforeEach(function(){
                var defer = q.defer();
                catalogAssignmentsCtrl.categoryid = 'categoryID';
                defer.resolve();
                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CatalogIDChanged', '123');
            });
            it('should call the ListAssignments method on OrderCloud Categories', function(){
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(catalogAssignmentsCtrl.categoryid);
            })
        });
        describe('listAllProducts', function(){
            beforeEach(function(){
                var defer = q.defer();
                catalogAssignmentsCtrl.listProducts = {};
                defer.resolve(catalogAssignmentsCtrl.listProducts);
                spyOn(oc.Products, 'List').and.returnValue(defer.promise);
            });
            it('should call the List method on OrderCloud Products', function(){
                var product = {};
                catalogAssignmentsCtrl.listAllProducts(product);
                expect(oc.Products.List).toHaveBeenCalledWith(product);
            })
        });
        describe('deleteAssignment', function(){
            beforeEach(function(){
                var defer = q.defer();
                catalogAssignmentsCtrl.categoryid = 'categoryID';
                defer.resolve();
                spyOn(oc.Categories, 'DeleteProductAssignment').and.returnValue(defer.promise);
            });
            it('should call the DeleteProductAssignment method on OrderCloud Categories', inject(function($stateParams){
                var product = {};
                catalogAssignmentsCtrl.deleteAssignment(product);
                expect(oc.Categories.DeleteProductAssignment).toHaveBeenCalledWith(catalogAssignmentsCtrl.categoryid, product.ID, $stateParams.catalogid)
            }))
        })
    })
});