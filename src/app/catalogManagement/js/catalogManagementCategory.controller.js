angular.module('orderCloud')
    .controller('CatalogManagementCategoryCtrl', CatalogManagementCategoryController)
;

function CatalogManagementCategoryController($rootScope, $state, ocCatalogManagement, SelectedCategory, CatalogID) {
    var vm = this;
    vm.category = SelectedCategory;
    $rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', vm.category.ID);

    vm.editCategory = function() {
        ocCatalogManagement.EditCategory(vm.category, CatalogID)
            .then(function(updatedCategory) {
                $rootScope.$broadcast('CatalogManagement:CategoryUpdated', {OriginalID: vm.category.ID, Category: updatedCategory});
                vm.category = updatedCategory;
            });
    };

    vm.deleteCategory = function() {
        ocCatalogManagement.DeleteCategory(vm.category, CatalogID)
            .then(function() {
                $rootScope.$broadcast('CatalogManagement:CategoryDeleted', vm.category);
                $state.go('catalogManagement');
            });
    };
}