describe('Component: CatalogManagement', function() {
    var rootScope,
        scope,
        q,
        oc,
        toaster,
        mockCatalogID,
        mockBuyerID,
        catalogViewManagement,
        categoryModalFactory;
    beforeEach(module(function($provide){
        $provide.value('CatalogID', 'CatalogID123');
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($rootScope, $q, OrderCloud, CatalogViewManagement, toastr, CategoryModalFactory) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        q = $q;
        toaster = toastr;
        oc = OrderCloud;
        mockCatalogID = 'MockCatalogID123';
        mockBuyerID = mockCatalogID;
        categoryModalFactory = CategoryModalFactory;
        catalogViewManagement = CatalogViewManagement;
    }));
    
    describe('State: catalogManagement', function() {
        var state;
        beforeEach(inject(function($state, CategoryTreeService) {
            state = $state.get('catalogManagement');
            spyOn(CategoryTreeService, 'GetCategoryTree');
        }));
        it('should resolve Tree', inject(function($injector, $stateParams, CategoryTreeService, CatalogID) {
            $injector.invoke(state.resolve.Tree);
            expect(CategoryTreeService.GetCategoryTree).toHaveBeenCalledWith(CatalogID);
        }));
    });

    describe('Controller: CategoryTreeCtrl', function() {
        var categoryTreeCtrl;
        beforeEach(inject(function($controller) {
            categoryTreeCtrl = $controller('CategoryViewTreeCtrl', {
                $scope: scope,
                CatalogID: mockCatalogID,
                Tree: 'mockTree',
                CatalogViewManagement: catalogViewManagement,
                CategoryModalFactory: categoryModalFactory
            });
        }));
        describe('categorySelected', function() {
            beforeEach(function() {
                spyOn(catalogViewManagement, 'SetCategoryID');
                categoryTreeCtrl.categorySelected('categoryID');
            });
            it('should call the SetCategoryID method on catalogViewManagement', function() {
                expect(catalogViewManagement.SetCategoryID).toHaveBeenCalledWith('categoryID', mockCatalogID);
            });
        });
        describe('createCategory', function() {
            beforeEach(function() {
                spyOn(categoryModalFactory, 'Create');
                categoryTreeCtrl.createCategory('parentid');
            });
            it('should call the Create method on CategoryModalFactory', function() {
                expect(categoryModalFactory.Create).toHaveBeenCalledWith('parentid', mockCatalogID);
            });
        });
        describe('editCategory', function(){
            beforeEach(function(){
                spyOn(categoryModalFactory, 'Edit');
                categoryTreeCtrl.editCategory('categoryID');
            });
            it('should call the Edit method on CategoryModalFactory', function(){
                expect(categoryModalFactory.Edit).toHaveBeenCalledWith('categoryID', mockCatalogID);
            });
        });
    });
    describe('Controller: CatalogAssignmentsCtrl', function() {
        var catalogAssignmentsCtrl,
            updatedCategoryID,
            exceptionHandler,
            productManagementModal,
            mockCategory,
            mockProduct
            ;
        beforeEach(inject(function($controller, $exceptionHandler, ProductManagementModal) {
            updatedCategoryID = 'updatedMockCategoryID123';
            productManagementModal = ProductManagementModal;
            exceptionHandler = $exceptionHandler;
            mockCategory = {Name:'MyCategory', ID:'mockCategory123'};
            mockProduct = {Name:'MyProduct', ID:'mockProduct123'};
            catalogAssignmentsCtrl = $controller('CatalogAssignmentsCtrl', {
                $rootScope: rootScope,
                $q: q,
                productManagementModal: ProductManagementModal,
                $exceptionHandler: exceptionHandler,
                Tree:'mockTree',
                CatalogID: mockCatalogID,
                SelectedBuyer:'mockBuyer'
            });
        }));
        describe('getProducts - when products are assigned to selected category', function(){
            var firstProductID = 'ProductID1';
            var secondProductID = 'ProductID2';
            beforeEach(function(){
                var productsDefer = q.defer();
                productsDefer.resolve({Meta:'mockProductsMeta', Items: [{ProductID: firstProductID}, {ProductID: secondProductID}] });
                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(productsDefer.promise);
                spyOn(oc.Products, 'List').and.returnValue(productsDefer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', mockCategory);
            });
            it('should call Category.ListProductAssignments to get first page of products for selected category', function(){
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(mockCategory.ID, null, undefined, 10, mockCatalogID);
            });
            it('it should call Products.List with the productIds from the ProductAssignments call', function(){
                scope.$digest();
                expect(oc.Products.List).toHaveBeenCalledWith(null, null, 10, null, null, {ID:firstProductID + '|'+ secondProductID });
            });
        });
        describe('getProducts - when no products are assigned to selected category', function(){
            beforeEach(function(){
                var defer = q.defer();
                defer.resolve({Meta:'mockProductsMeta', Items: null });

                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(defer.promise);
                spyOn(oc.Products, 'List').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', mockCategory);
            });
            it('should call Category.ListProductAssignments to get first page of products for selected category', function(){
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(mockCategory.ID, null, undefined, 10, mockCatalogID);
            });
            it('should NOT call Products.List', function(){
                expect(oc.Products.List).not.toHaveBeenCalled();
            });
        });
        describe('getUserGroups - when userGroups are assigned to selected category', function(){
            var firstUserGroupID = 'userGroup1';
            var secondUserGroupID = 'userGroup2';
            beforeEach(function(){
                var defer = q.defer();
                defer.resolve({Meta:'mockProductsMeta', Items: [{UserGroupID: firstUserGroupID}, {UserGroupID: secondUserGroupID}] });
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                spyOn(oc.UserGroups, 'List').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', mockCategory);
            });
            it('should call Category.ListAssignments to get first page of userGroups for selected category', function(){
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(mockCategory.ID, null, null, null, undefined, 10, mockBuyerID, mockCatalogID);
            });
            it('it should call UserGroups.List with the userGroupIDs from the ListAssignments call', function(){
                scope.$digest();
                expect(oc.UserGroups.List).toHaveBeenCalledWith(null, null, 10, null, null, {ID:firstUserGroupID + '|'+ secondUserGroupID }, mockBuyerID);
            });
        });
        describe('getUserGroups - when no userGroups are assigned to selected category', function(){
            beforeEach(function(){
                var defer = q.defer();
                defer.resolve({Meta:'mockProductsMeta', Items: null });
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                spyOn(oc.UserGroups, 'List').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', mockCategory);
            });
            it('should call Category.ListAssignments to get first page of userGroups for selected category', function(){
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(mockCategory.ID, null, null, null, undefined, 10, mockBuyerID, mockCatalogID);
            });
            it('it should call UserGroups.List with the userGroupIDs from the ListAssignments call', function(){
                scope.$digest();
                expect(oc.UserGroups.List).not.toHaveBeenCalled();
            });
        });
        describe('isAssignedAtBuyerLevel', function(){
            it('should set vm.assignmentType to buyer if any assignments at buyer level exist', function(){
                var defer = q.defer();
                defer.resolve({Meta: {TotalCount: 1}});
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', mockCategory);
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(mockCategory.ID, null, null, 'Company', null, null, mockBuyerID, mockCatalogID)
                expect(catalogAssignmentsCtrl.assignmentType).toBe('buyer');
            });
            it('should set vm.assignmentType to userGroups if no assignments at buyer level exist', function(){
                var defer = q.defer();
                defer.resolve({Meta: {TotalCount: null}});
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', mockCategory);
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(mockCategory.ID, null, null, 'Company', null, null, mockBuyerID, mockCatalogID);
                scope.$digest();
                expect(catalogAssignmentsCtrl.assignmentType).toBe('userGroups');
            });
        });
        describe('productPageChanged', function(){
            var mockPage = 3;
            beforeEach(function(){
                catalogAssignmentsCtrl.products = {Meta: {Page:mockPage}};
                catalogAssignmentsCtrl.category = mockCategory;
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(defer.promise);
                catalogAssignmentsCtrl.productPageChanged();
            });
            it('should get call Categories.ListProductAssignments with the page number', function(){
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith(mockCategory.ID, null, mockPage, 10, mockCatalogID);
            });
        });
        describe('userGroupPageChanged', function(){
            var mockPage = 3;
            beforeEach(function(){
                catalogAssignmentsCtrl.userGroups = {Meta: {Page:mockPage}};
                catalogAssignmentsCtrl.category = mockCategory;
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                catalogAssignmentsCtrl.userGroupPageChanged();
            });
            it('should get call Categories.ListAssignments with the page number', function(){
                expect(oc.Categories.ListAssignments).toHaveBeenCalledWith(mockCategory.ID, null, null, null, mockPage, 10, mockBuyerID, mockCatalogID);
            });
        });
        describe('listAllProducts', function() {
            var searchTerm = 'findMyProduct';  
            beforeEach(function() {
                var defer = q.defer();   
                defer.resolve(mockProduct);
                spyOn(oc.Products, 'List').and.returnValue(defer.promise);
            });
            it('should call the List method on OrderCloud Products', function() {
                catalogAssignmentsCtrl.listAllProducts(searchTerm);
                expect(oc.Products.List).toHaveBeenCalledWith(searchTerm);
                scope.$digest();
                expect(catalogAssignmentsCtrl.uiSelectProducts).toBe(mockProduct);
            });
        });
        describe('listAllUserGroups', function() {
            var mockUserGroup = {Name:'userGroup1', ID:'mockUserGroup123'};
            var searchTerm = 'findMyUserGroup';  
            beforeEach(function() {
                var defer = q.defer();   
                defer.resolve(mockUserGroup);
                spyOn(oc.UserGroups, 'List').and.returnValue(defer.promise);
            });
            it('should call the List method on OrderCloud Products', function() {
                catalogAssignmentsCtrl.listAllUserGroups(searchTerm);
                expect(oc.UserGroups.List).toHaveBeenCalledWith(searchTerm, null, null, null, null, null, mockBuyerID);
                scope.$digest();
                expect(catalogAssignmentsCtrl.uiSelectedGroups).toBe(mockUserGroup);
            });
        });
        describe('saveAssignment', function(){
            var mockSelectedProducts = [
                {Name:'Product1', ProductID:'Prod123'},
                {Name:'Product2', ProductID:'Prod456'},
                {Name:'Product3', ProductID:'Prod789'}];
            beforeEach(function(){
                catalogAssignmentsCtrl.selectedProducts = mockSelectedProducts;
                catalogAssignmentsCtrl.category = mockCategory;
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'SaveProductAssignment').and.returnValue(defer.promise);
                spyOn(toaster, 'success');
                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(defer.promise);
                catalogAssignmentsCtrl.saveAssignment();
            });
            it('should assign each product in selected list, to the selected category', function(){
                expect(oc.Categories.SaveProductAssignment).toHaveBeenCalledTimes(3);
            });
            it('should call toastr on success', function(){
                scope.$digest();
                expect(toaster.success).toHaveBeenCalledWith('Products assigned to ' + mockCategory.Name, 'Success');
            });
            it('should refresh list of products and clear any selected products', function(){
                scope.$digest();
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalled();
            });
            it('should clear selected products', function(){
                scope.$digest();
                expect(catalogAssignmentsCtrl.selectedProducts).toBe(null);
            });
        });
        describe('savePartyAssignment', function(){
            var mockSelectedUserGroups = [
                {Name:'UserGroup1', UserGroupID:'UG1'},
                {Name:'UserGroup2', UserGroupID:'UG2'},
                {Name:'UserGroup3', UserGroupID:'UG3'}];
            beforeEach(function(){
                catalogAssignmentsCtrl.selectedUserGroups = mockSelectedUserGroups;
                catalogAssignmentsCtrl.category = mockCategory;
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'SaveAssignment').and.returnValue(defer.promise);
                spyOn(toaster, 'success');
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                catalogAssignmentsCtrl.savePartyAssignment();
            });
            it('should assign each product in selected list, to the selected category', function(){
                expect(oc.Categories.SaveAssignment).toHaveBeenCalledTimes(3);
            });
            it('should call toastr on success', function(){
                scope.$digest();
                expect(toaster.success).toHaveBeenCalledWith('User Groups assigned to ' + mockCategory.Name, 'Success');
            });
            it('should refresh list of products and clear any selected products', function(){
                scope.$digest();
                expect(oc.Categories.ListAssignments).toHaveBeenCalled();
            });
            it('should clear selected products', function(){
                scope.$digest();
                expect(catalogAssignmentsCtrl.selectedUserGroups).toBe(null);
            });
        });
        describe('toggleBuyerAssignment', function(){
            var assignment;
            beforeEach(function(){
                catalogAssignmentsCtrl.category = mockCategory;
                assignment = {
                    CategoryID: mockCategory.ID,
                    BuyerID: mockBuyerID,
                    UserID: null,
                    UserGroupID: null
                };

                var defer = q.defer();
                defer.resolve(assignment, mockCatalogID);
                spyOn(oc.Categories, 'SaveAssignment').and.returnValue(defer.promise);
                spyOn(catalogAssignmentsCtrl, 'deletePartyAssignment');
            });
            it('should save buyer assignment, if one doesnt exist', function(){
                catalogAssignmentsCtrl.assignmentType = 'buyer';
                catalogAssignmentsCtrl.toggleBuyerAssignment();
                expect(oc.Categories.SaveAssignment).toHaveBeenCalledWith(assignment, mockCatalogID);
            });
            it('should delete buyer assignment, if one already exists', function(){
                catalogAssignmentsCtrl.assignmentType = 'userGroup';
                catalogAssignmentsCtrl.toggleBuyerAssignment();
                expect(catalogAssignmentsCtrl.deletePartyAssignment).toHaveBeenCalled();
            });
        });
        describe('deleteAssignment', function() {
            beforeEach(function() {
                var defer = q.defer();
                catalogAssignmentsCtrl.category = mockCategory;
                defer.resolve();
                spyOn(oc.Categories, 'DeleteProductAssignment').and.returnValue(defer.promise);
                spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(defer.promise);
                catalogAssignmentsCtrl.deleteAssignment(mockProduct);
            });
            it('should call the DeleteProductAssignment method on OrderCloud Categories', function() {
                expect(oc.Categories.DeleteProductAssignment).toHaveBeenCalledWith(catalogAssignmentsCtrl.category.ID, mockProduct.ID, mockCatalogID);
            });
            it('should refresh list of products after deleting', function(){
                scope.$digest();
                expect(oc.Categories.ListProductAssignments).toHaveBeenCalled();
            });
        });
        describe('deletePartyAssignment', function(){
            var mockUserGroup = {Name:'UserGroup123', ID:'userGroupID123'}
            beforeEach(function(){
                catalogAssignmentsCtrl.category = mockCategory;
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.Categories, 'DeleteAssignment').and.returnValue(defer.promise);
                spyOn(oc.Categories, 'ListAssignments').and.returnValue(defer.promise);
                spyOn(toaster, 'success');
            });
            it('it should delete userGroup assignment, if user group is defined', function(){
                catalogAssignmentsCtrl.deletePartyAssignment(mockUserGroup);
                expect(oc.Categories.DeleteAssignment).toHaveBeenCalledWith(mockCategory.ID, null, mockUserGroup.ID, mockBuyerID, mockCatalogID);
            });
            it('it should delete buyer assignment, if no user group is defined', function(){
                catalogAssignmentsCtrl.deletePartyAssignment();
                expect(oc.Categories.DeleteAssignment).toHaveBeenCalledWith(mockCategory.ID, null, null, mockBuyerID, mockCatalogID);
            });
            it('if user group is defined, it should display user-group specific success toastr', function(){
                catalogAssignmentsCtrl.deletePartyAssignment(mockUserGroup);
                scope.$digest();
                expect(toaster.success).toHaveBeenCalledWith(mockUserGroup.Name + ' removed from ' + mockCategory.Name);
            });
            it('if user group is not defined it should display buyer specific success toastr', function(){
                catalogAssignmentsCtrl.deletePartyAssignment();
                scope.$digest();
                expect(toaster.success).toHaveBeenCalledWith('Buyer organization removed from ' + mockCategory.Name);
            });
            it('should refresh list of userGroups after deleting assignment', function(){
                catalogAssignmentsCtrl.deletePartyAssignment(mockUserGroup);
                scope.$digest();
                expect(oc.Categories.ListAssignments).toHaveBeenCalled();
            });
        });
    });
});