angular.module('orderCloud')
    .controller('CatalogCategoryCtrl', CatalogManagementCategoryController)
;

function CatalogManagementCategoryController($rootScope, $stateParams, $state, toastr, ocCatalog, SelectedCategory) {
    var vm = this;
    vm.category = SelectedCategory;
    $rootScope.$broadcast('CatalogViewManagement:CategoryIDChanged', vm.category.ID);

    vm.editCategory = function() {
        ocCatalog.EditCategory(vm.category, $stateParams.catalogid)
            .then(function(updatedCategory) {
                $rootScope.$broadcast('CatalogManagement:CategoryUpdated', {OriginalID: vm.category.ID, Category: updatedCategory});
                vm.category = updatedCategory;
                toastr.success(updatedCategory.Name + ' was updated.');
            });
    };

    vm.deleteCategory = function() {
        ocCatalog.DeleteCategory(vm.category, $stateParams.catalogid)
            .then(function() {
                $rootScope.$broadcast('CatalogManagement:CategoryDeleted', vm.category);
                $state.go('categories');
                toastr.success(vm.category.Name + ' was deleted.');
            });
    };
}