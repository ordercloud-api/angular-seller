fdescribe('Component: CatalogManagement', function() {
    var rootScope,
        q,
        oc,
        mockCatalogID,
        catalogViewManagement,
        categoryModalFactory;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, $q, OrderCloud, CatalogViewManagement, CategoryModalFactory) {
        rootScope = $rootScope;
        q = $q;
        oc = OrderCloud;
        mockCatalogID = 'MockID123';
        categoryModalFactory = CategoryModalFactory;
        catalogViewManagement = CatalogViewManagement;
    }));

    describe('State: catalogManagement', function() {
        var state;
        beforeEach(inject(function($state, CategoryTreeService) {
            state = $state.get('catalogManagement');
            spyOn(CategoryTreeService, 'GetCategoryTree');
        }));
        it('should resolve Tree', inject(function($injector, $stateParams, CategoryTreeService) {
            $injector.invoke(state.views[''].resolve.Tree);
            expect(CategoryTreeService.GetCategoryTree).toHaveBeenCalledWith($stateParams.catalogid);
        }));
    });

    describe('Controller: CategoryTreeCtrl', function() {
        var categoryTreeCtrl;
        beforeEach(inject(function($controller) {
            categoryTreeCtrl = $controller('CategoryTreeCtrl', {
                CatalogID: mockCatalogID,
                Tree: {Category: mockCatalogID}
            });
        }));
        describe('categorySelected', function() {
            beforeEach(inject(function() {
                spyOn(catalogViewManagement, 'SetCategoryID');
                categoryTreeCtrl.categorySelected('category');
            }));
            it('should call the SetCategoryID method on catalogViewManagement', function() {
                expect(catalogViewManagement.SetCategoryID).toHaveBeenCalledWith('category');
            });
        });
        describe('createCategory', function() {
            beforeEach(inject(function() {
                spyOn(categoryModalFactory, 'Create');
                categoryTreeCtrl.createCategory('parentid', 'mockID');
            }));
            it('should call the Create method on categoryModalFactory', function() {
                expect(categoryModalFactory.Create).toHaveBeenCalledWith('parentid', mockCatalogID);
            });
        });
    });

    describe('Controller: CatalogAssignmentsCtrl', function() {
        var catalogAssignmentsCtrl,
            updatedCategoryID;
        beforeEach(inject(function($controller) {
            updatedCategoryID='updatedMockCategoryID123';
            catalogAssignmentsCtrl = $controller('CatalogAssignmentsCtrl', {
                CatalogID: mockCatalogID
            });
        }));
        describe('getAssignments', function() {
            beforeEach(function() {
                var defer = q.defer();
                catalogAssignmentsCtrl.assignments = {};
                defer.resolve();
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', updatedCategoryID);
            });
            it('should call the ListAssignments method on OrderCloud Categories', function() {
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(updatedCategoryID);
            });
        });
        describe('getProducts', function() {
            beforeEach(function() {
                var defer = q.defer();
                catalogAssignmentsCtrl.categoryid = updatedCategoryID;
                defer.resolve();
                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', '123');
            });
            it('should call the ListAssignments method on OrderCloud Categories', function() {
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(catalogAssignmentsCtrl.categoryid);
            });
        });
        describe('listAllProducts', function() {
            beforeEach(function() {
                var defer = q.defer();
                catalogAssignmentsCtrl.listProducts = {};
                defer.resolve(catalogAssignmentsCtrl.listProducts);
                spyOn(oc.Products, 'List').and.returnValue(defer.promise);
            });
            it('should call the List method on OrderCloud Products', function() {
                var product = {};
                catalogAssignmentsCtrl.listAllProducts(product);
                expect(oc.Products.List).toHaveBeenCalledWith(product);
            });
        });
        describe('deleteAssignment', function() {
            beforeEach(function() {
                var defer = q.defer();
                catalogAssignmentsCtrl.categoryid = 'categoryID';
                defer.resolve();
                spyOn(oc.Categories, 'DeleteProductAssignment').and.returnValue(defer.promise);
            });
            it('should call the DeleteProductAssignment method on OrderCloud Categories', inject(function($stateParams) {
                var mockProductID = 'ProductID123';
                var product = {ID: mockProductID};
                catalogAssignmentsCtrl.deleteAssignment(product);
                expect(oc.Categories.DeleteProductAssignment).toHaveBeenCalledWith(catalogAssignmentsCtrl.categoryid, mockProductID, mockCatalogID);
            }));
        });
    });
});