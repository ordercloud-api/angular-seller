describe('Component: Catalog Search', function() {
    var scope,
        q,
        oc,
        searchTerm,
        mockProductList,
        mockCategoryList,
        mockProductData,
        mockCategoryData
        ;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q,$rootScope,OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
        searchTerm = 'burger';
        mockProductList =
            {
                "Meta": {},
                "Items": [{
                    "ID": "TestProductID123456789",
                    "Name": "TestProduct1234"
                }]
            };
        mockCategoryList =
            {
                "Meta": {},
                "Items": [{
                    "ID": "TestCategoryID123456789",
                    "Name": "TestCategory1234"
                }]
            };
        mockProductData =
            {
                "ID": "TestProductID123456789",
                "Name": "TestProduct1234",
                "NameType": 'Product'
            };
        mockCategoryData =
            {
                "ID": "TestCategoryID123456789",
                "Name": "TestCategory1234",
                "NameType": 'Category'
            }
    }));
    describe('State: catalogSearchResults', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('catalogSearchResults', {}, {reload: true});
            spyOn(oc.Me, 'ListCategories');
            spyOn(oc.Me, 'ListProducts');
        }));
        it('should resolve CategoryList', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.CategoryList);
            expect(oc.Me.ListCategories).toHaveBeenCalledWith($stateParams.searchTerm, null, null, null, null, null, 'all');
        }));
        it('should resolve ProductList', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.ProductList);
            expect(oc.Me.ListProducts).toHaveBeenCalledWith($stateParams.searchTerm);
        }))
    });
    describe('Controller: CatalogSearchController', function() {
        var catalogSearchCtrl;
        beforeEach(inject(function($state,$controller) {
            catalogSearchCtrl = $controller('CatalogSearchCtrl', {
                $scope: scope
            });
            spyOn($state, 'go');
        }));
        describe('popUpResults', function() {
            beforeEach(function() {
                term = searchTerm;
                catalogSearchCtrl.productData = mockProductData;
                catalogSearchCtrl.categoryData = mockCategoryData;
                spyOn(oc.Me, 'ListProducts').and.returnValue(mockProductList);
                spyOn(oc.Me, 'ListCategories').and.returnValue(mockCategoryList);
                catalogSearchCtrl.popupResults(term);
                scope.$digest();
            });
            it('should call the Me.ListProducts method', function() {
                expect(oc.Me.ListProducts).toHaveBeenCalledWith(searchTerm, 1, 5)
            });
            it('should call the Me.ListCategories method', function() {
                expect(oc.Me.ListCategories).toHaveBeenCalledWith(searchTerm, 1, 5, null, null, null, 'all')
            });
        });
        describe('onSelect', function() {
            it('should go to catalog.category state if $item.NameType is "Category"',inject(function($state) {
                catalogSearchCtrl.onSelect(mockCategoryData);
                expect($state.go).toHaveBeenCalledWith('catalog.category', {categoryid:"TestCategoryID123456789"});
            }));
            it('should go to catalog.product state if $item.NameType is "Product"', inject(function($state) {
                catalogSearchCtrl.onSelect(mockProductData);
                expect($state.go).toHaveBeenCalledWith('catalog.product', {productid:"TestProductID123456789"})
            }));
        });
        describe('onHardEnter', function() {
            it('should go to CatalogSearchResults page with search term as parameter', inject(function($state) {
                catalogSearchCtrl.onHardEnter(searchTerm);
                expect($state.go).toHaveBeenCalledWith('catalogSearchResults', {searchterm: searchTerm}, {reload: true})
            }))
        });
    });
    describe('Directive: ordercloudCatalogSearch', function() {
        var element;
        beforeEach(inject(function($compile) {
            element = $compile('<ordercloud-catalog-search maxprods="8" maxcats="8"></ordercloud-catalog-search>')(scope);
            scope.$digest();
        }));
        it('should initialize the isolate scope', function() {
            expect(element.isolateScope().maxprods).toBe('8');
            expect(element.isolateScope().maxcats).toBe('8');
        });
    });
});

