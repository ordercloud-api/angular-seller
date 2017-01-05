describe('Component: Catalogs', function(){
    var scope,
        q,
        oc,
        catalog;
    beforeEach(module(function($provide){
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, $q, OrderCloud){
        scope = $rootScope.$new();
        q = $q;
        oc = OrderCloud;
        catalog = {
            ID: 'CatalogID',
            Name: 'CatalogName'
        };
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
            });
        });
        describe('clearSearch', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.clearSearch();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(true);
            });
        });
        describe('clearFilters', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.clearFilters();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(true);
            });
        });
        describe('updateSort', function(){
            beforeEach(function(){
                spyOn(catalogsCtrl, 'filter');
            });
            it('should call the filter method', function(){
                catalogsCtrl.updateSort();
                expect(catalogsCtrl.filter).toHaveBeenCalledWith(false);
            });
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

    describe('Controller: CreateCatalogCtrl', function(){
        var catalogCreateCtrl,
            toaster;
        beforeEach(inject(function($state, $controller, toastr){
            toaster = toastr;
            catalogCreateCtrl = $controller('CreateCatalogCtrl', {
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
                expect($state.go).toHaveBeenCalledWith('catalogs', {catalogid: catalogCreateCtrl.catalog.ID}, {reload: true});
            }));
        });
    });
});