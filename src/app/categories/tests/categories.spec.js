describe('Component: Categories', function() {
    var scope,
        q,
        category,
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
            Active: true
        };
        oc = OrderCloud;
    }));

    describe('State: categories', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('categories');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Categories, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve CategoryList', inject(function($injector) {
            $injector.invoke(state.resolve.CategoryList);
            expect(oc.Categories.List).toHaveBeenCalled();
        }));
    });

    describe('State: categories.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('categories.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Categories, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedCategory', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCategory);
            expect(oc.Categories.Get).toHaveBeenCalledWith($stateParams.categoryid);
        }));
    });

    describe('State: categories.assignParty', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('categories.assignParty');
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.Categories, 'ListAssignments').and.returnValue(null);
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Categories, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUserGroups', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUserGroups);
            expect(oc.Categories.ListAssignments).toHaveBeenCalledWith($stateParams.categoryid);
        }));
        it('should resolve SelectedCategory', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCategory);
            expect(oc.Categories.Get).toHaveBeenCalledWith($stateParams.categoryid);
        }));
    });

    describe('State: categories.assignProduct', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('categories.assignProduct');
            spyOn(oc.Products, 'List').and.returnValue(null);
            spyOn(oc.Categories, 'ListProductAssignments').and.returnValue(null);
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Categories, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve ProductList', inject(function($injector) {
            $injector.invoke(state.resolve.ProductList);
            expect(oc.Products.List).toHaveBeenCalled();
        }));
        it('should resolve ProductAssignments', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.ProductAssignments);
            expect(oc.Categories.ListProductAssignments).toHaveBeenCalledWith($stateParams.categoryid);
        }));
        it('should resolve SelectedCategory', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCategory);
            expect(oc.Categories.Get).toHaveBeenCalledWith($stateParams.categoryid);
        }));
    });

    describe('Controller: CategoryEditCtrl', function() {
        var categoryEditCtrl;
        beforeEach(inject(function($state, $controller) {
            categoryEditCtrl = $controller('CategoryEditCtrl', {
                $scope: scope,
                SelectedCategory: category
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                categoryEditCtrl.category = category;
                categoryEditCtrl.categoryID = "TestCategory123456789";
                var defer = q.defer();
                defer.resolve(category);
                spyOn(oc.Categories, 'Update').and.returnValue(defer.promise);
                categoryEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Categories Update method', function() {
                expect(oc.Categories.Update).toHaveBeenCalledWith(categoryEditCtrl.categoryID, categoryEditCtrl.category);
            });
            it ('should enter the categories state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('categories', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach((function() {
                var defer = q.defer();
                defer.resolve(category);
                spyOn(oc.Categories, 'Delete').and.returnValue(defer.promise);
                categoryEditCtrl.Delete();
                scope.$digest();
            }));
            it ('should call the Categories Delete method', function() {
                expect(oc.Categories.Delete).toHaveBeenCalledWith(category.ID);
            });
            it ('should enter the categories state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('categories', {}, {reload: true});
            }));
        });
    });

    describe('Controller: CategoryCreateCtrl', function() {
        var categoryCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            categoryCreateCtrl = $controller('CategoryCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                categoryCreateCtrl.category = category;
                var defer = q.defer();
                defer.resolve(category);
                spyOn(oc.Categories, 'Create').and.returnValue(defer.promise);
                categoryCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Categories Create method', function() {
                expect(oc.Categories.Create).toHaveBeenCalledWith(category);
            });
            it ('should enter the categories state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('categories', {}, {reload: true});
            }));
        });
    });

    describe('Controller: CategoryTreeCtrl', function() {
        var categoryTreeCtrl;
        beforeEach(inject(function($state, $controller, CategoryTreeService) {
            categoryTreeCtrl = $controller('CategoryTreeCtrl', {
                $scope: scope,
                CategoryTreeService: CategoryTreeService,
                Catalog: {},
                Tree: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('treeOptions.dropped', function() {
            beforeEach(inject(function(CategoryTreeService) {
                spyOn(CategoryTreeService, 'UpdateCategoryNode').and.returnValue(null);
                categoryTreeCtrl.treeOptions.dropped();
            }));
            it ('should call the CategoryTreeService UpdateCategoryNode method', inject(function(CategoryTreeService) {
                expect(CategoryTreeService.UpdateCategoryNode).toHaveBeenCalled();
            }));
        });
    });

    describe('Controller: CategoryAssignPartyCtrl', function() {
        var categoryAssignCtrl;
        beforeEach(inject(function($state, $controller) {
            categoryAssignCtrl = $controller('CategoryAssignPartyCtrl', {
                $scope: scope,
                UserGroupList: [],
                AssignedUserGroups: [],
                SelectedCategory: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function(Assignments) {
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                categoryAssignCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                spyOn(Paging, 'Paging').and.returnValue(null);
                categoryAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    });

    describe('Controller: CategoryAssignProductCtrl', function() {
        var categoryAssignProductCtrl;
        beforeEach(inject(function($state, $controller) {
            categoryAssignProductCtrl = $controller('CategoryAssignProductCtrl', {
                $scope: scope,
                ProductList: [],
                ProductAssignments: [],
                SelectedCategory: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function(Assignments) {
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                categoryAssignProductCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                spyOn(Paging, 'Paging').and.returnValue(null);
                categoryAssignProductCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    });

    describe('Factory: CategoryTreeService', function() {
        var treeService;
        beforeEach(inject(function(CategoryTreeService) {
            treeService = CategoryTreeService;
            var defer = q.defer();
            defer.resolve({Items: [], Meta: {}});
            spyOn(oc.Categories, 'List').and.returnValue(defer.promise);
        }));

        describe('GetCategoryTree', function() {
            beforeEach(function() {
                treeService.GetCategoryTree();
            });

            it ('should call the Categories List method', function() {
                expect(oc.Categories.List).toHaveBeenCalledWith(null, 1, 100, null, null, null, 'all');
            });
        });
    });
});

