angular.module('orderCloud')
    .config(CatalogManagementConfig)
    .controller('CatalogManagementCtrl', CatalogManagementController)
    .factory('CatalogViewManagement', CatalogViewManagement);

function CatalogManagementConfig($stateProvider) {
    $stateProvider
        .state('catalogManagement', {
            parent: 'buyersDetails',
            url: '/catalogManagement',
            resolve: {
                CatalogID: function(SelectedBuyer) {
                    //TODO: write unit test for this resolve
                    return SelectedBuyer.DefaultCatalogID;
                },
                Tree: function(CategoryTreeService, CatalogID) {
                    return CategoryTreeService.GetCategoryTree(CatalogID);
                }
            },
            views: {
                '': {
                    templateUrl: 'catalogManagement/templates/catalogManagement.html',
                    controller: 'CatalogManagementCtrl',
                    controllerAs:'catalogManagement'
                },
                'category-tree@catalogManagement': {
                    templateUrl: 'catalogManagement/categoryTreeView/templates/categoryTreeView.html',
                    controller: 'CategoryViewTreeCtrl',
                    controllerAs: 'categoryTree'
                },
                'assignments@catalogManagement': {
                    templateUrl: 'catalogManagement/assignmentsView/templates/assignmentsView.html',
                    controller: 'CatalogAssignmentsCtrl',
                    controllerAs: 'catalogAssignments'
                }
            }
        });
}

function CatalogManagementController($rootScope, Tree, CatalogID) {
    var vm = this;
    vm.tree = Tree;
    vm.catalogid = CatalogID;
    vm.selectedCategory = null;

    $rootScope.$on('CatalogViewManagement:CategoryIDChanged', function(e, category){
         vm.selectedCategory = category;
     });
}

function CatalogViewManagement($rootScope, OrderCloud) {
    var service = {
        GetCategoryID: GetCategoryID,
        SetCategoryID: SetCategoryID
    };
    var categoryid = null;

    function GetCategoryID() {
        return categoryid;
    }

    function SetCategoryID(category, catalogid) {
        categoryid = category;
        OrderCloud.Categories.Get(category, catalogid)
            .then(function(data){
                $rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', data);
            });
    }
    return service;
}