angular.module('orderCloud')
    .config(CatalogsConfig)
    .controller('CatalogsCtrl', CatalogsController)
    .controller('CatalogCreateCtrl', CatalogCreateController)
    .controller('CatalogTreeCtrl', CatalogTreeController)
    .controller('CatalogAssignmentsCtrl', CatalogAssignmentsController)
    .factory('CatalogViewManagement', CatalogViewManagement)
;

function CatalogsConfig($stateProvider){
    $stateProvider
        .state('catalogs', {
            parent: 'base',
            url: '/catalogs?search?page?pageSize?searchOn?sortBy?filters',
            templateUrl: 'catalogs/templates/catalogs.tpl.html',
            controller: 'CatalogsCtrl',
            controllerAs: 'catalogs',
            resolve: {
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                CatalogsList: function (OrderCloud, Parameters) {
                    return OrderCloud.Catalogs.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy);
                },
                BuyersList: function (OrderCloud, Parameters) {
                    return OrderCloud.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy);
                }
            }
        })
        .state('catalogs.create', {
            url: '/create',
            templateUrl: 'catalogs/templates/createNewCatalog.tpl.html',
            controller: 'CatalogCreateCtrl',
            controllerAs: 'catalogCreate'
        })
        .state('catalogs.edit', {
            url:'/edit/:catalogid',
            views:{
                '': {
                    templateUrl:'catalogs/templates/catalogs.edit.tree.tpl.html',
                    controller:'CatalogTreeCtrl',
                    controllerAs:'categoryTree',
                    resolve: {
                        CatalogID: function($stateParams){
                            return $stateParams.catalogid;
                        },
                        Tree: function(CategoryTreeService, $stateParams){
                            return CategoryTreeService.GetCategoryTree($stateParams.catalogid);
                        }
                    }
                },
                'assignments@catalogs.edit': {
                    templateUrl:'catalogs/templates/catalogs.edit.assignments.tpl.html',
                    controller:'CatalogAssignmentsCtrl',
                    controllerAs:'catalogAssignments'
                }
            }
        });
}

function CatalogsController($state, $ocMedia, OrderCloud, OrderCloudParameters, Parameters, CatalogsList){
    var vm = this;
    vm.list = CatalogsList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') === 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //check if filters are applied:
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width: 767px') && vm.sortSelection);
    vm.showFilters = vm.filtersApplied;

    //check if search was used:
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //reload the state with new parameters:
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //reload the state with new search parameters & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //clear the relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width: 767px') ? vm.parameters.sortBy = null : angular.noop();
        vm.filter(true);
    };

    //conditionally set, reverse, and remove the sortBy parameters & reload the state
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') === 0 ? vm.parameters.sortBy = Parameters.sortBy.split("!")[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    vm.pageChanged = function(){
        $state.go('.', {page: vm.list.Meta.Page});
    };

    vm.loadMore = function(){
        return OrderCloud.Catalogs.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data){
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function CatalogCreateController(OrderCloud, $state, $exceptionHandler, toastr){
    var vm = this;
    vm.catalog = {};
    vm.catalog.Active = true;
    vm.catalogCreated = false;

    vm.saveCatalog = function(){
        if(vm.catalogCreated) {
            OrderCloud.Catalogs.Update(vm.catalog.ID, vm.catalog)
                .then(function(){
                    toastr.success('Catalog Saved', 'Success');
                    $state.go('catalogs', {catalogid: vm.catalog.ID, fromstate: "catalogCreate"}, {reload: true});
                })
                .catch(function(ex){
                    $exceptionHandler(ex)
                })
        } else {
            OrderCloud.Catalogs.Create(vm.catalog)
                .then(function(data){
                    vm.catalog.ID = data.ID;
                    vm.catalogCreated = true;
                    toastr.success('Catalog Created', 'Success');
                    $state.go('catalogs', {catalogid: vm.catalog.ID, fromstate: "catalogCreate"}, {reload: true});
                })
                .catch(function(ex){
                    $exceptionHandler(ex)
                });
        }
    }

}

 function CatalogTreeController(CatalogViewManagement, CategoryModalFactory, Tree, CatalogID){
     var vm = this;
     vm.tree = Tree;
     vm.catalogid = CatalogID;
     vm.categorySelected = function(category){
         CatalogViewManagement.SetCategoryID(category);
         vm.selectedCategory = category;
     };
     vm.createCategory = function(parentid){
         CategoryModalFactory.Create(parentid, vm.catalogid);
     };
     vm.editCategory = function(id){
         CategoryModalFactory.Edit(id, vm.catalogid);
     };
     vm.deleteCategory = function(id) {
         CategoryModalFactory.Delete(id, vm.catalogid);
     };
 }

 function CatalogAssignmentsController($q, toastr, $rootScope, OrderCloud, ProductManagementModal, $stateParams){
     var vm = this;
     vm.productIds = null;
     vm.pageSize = 10;
     vm.categoryid = null;
     vm.assignments = null;
     vm.products = null;
     //vm.selectedProducts = [];

     $rootScope.$on('CatalogViewManagement:CategoryIDChanged', function(e, id){
         vm.categoryid = id;
         getAssignments();
         getProducts();
     });
     
     function getAssignments(){
         OrderCloud.Categories.ListAssignments(vm.categoryid)   
            .then(function(assignments){
                vm.assignments = assignments;
            });
     }

     function getProducts(){
         OrderCloud.Categories.ListProductAssignments(vm.categoryid)
            .then(function(assignmentList){
                vm.productIds = _.pluck(assignmentList.Items, 'ProductID');
                if(!vm.productIds.length) {
                    vm.products = null;
                } else {
                    var pageone = vm.productIds.length > vm.pageSize ? vm.productIds.slice(0, vm.pageSize) : vm.productIds;
                    var filter = {ID: pageone.join('|')};
                    OrderCloud.Products.List(null, null, null, null, null, filter)
                        .then(function(productList){
                            vm.products = productList.Items;
                        });
                }
            });
     }

     vm.listAllProducts = function(product){
         return OrderCloud.Products.List(product)
             .then(function(data){
                 vm.listProducts = data;
             });
     };

     vm.saveAssignment = function(){
         var productQueue = [];
         var df = $q.defer();
         angular.forEach(vm.selectedProducts, function(product){
             productQueue.push(OrderCloud.Categories.SaveProductAssignment(
                 {
                    ProductID :  product.ID,
                    CategoryID : vm.categoryid
                 },
                 $stateParams.catalogid
             ));
         });
         $q.all(productQueue)
             .then(function(data){
                 df.resolve();
                 toastr.success('All Products Saved', 'Success');
             })
             .catch(function(error){
                 toastr.error(error.data.Errors[0].Message);
             })
             .finally(function(){
                 getProducts();
                 vm.selectedProducts = null;
             });
         return df.promise;
     };
         
     vm.addProductModal = function(){
         ProductManagementModal.AssignProductToCategory(vm.categoryid, $stateParams.catalogid);
     };

     vm.deleteAssignment = function(product){
         OrderCloud.Categories.DeleteProductAssignment(vm.categoryid, product.ID, $stateParams.catalogid)
             .then(function(){
                 toastr.success('Product ' + product.Name + ' Removed from Category ' + vm.categoryid);
             })
             .catch(function(error){
                 toastr.error('There was an error removing products from the category');
             })
             .finally(function(){
                 getProducts();
             })
     }
     
 }

 function CatalogViewManagement($rootScope){
     var service = {
         GetCategoryID: GetCategoryID,
         SetCategoryID: SetCategoryID
     };
     var catalogid = null;

     function GetCategoryID(){
         return catalogid;
     }

     function SetCategoryID(category){
         catalogid = category;
         $rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', catalogid);
     }
     return service;
 }