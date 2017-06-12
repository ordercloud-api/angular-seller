angular.module('orderCloud')
    .controller('CatalogCategoriesCtrl', CatalogCategoriesController)
;

function CatalogCategoriesController($rootScope, toastr, $stateParams, $state, ocCatalog, ocCatalogTree, Tree) {
    var vm = this;
    vm.tree = Tree;
    vm.catalogid = $stateParams.catalogid;

    vm.treeOptions = {
        dropped: function(event) {
            ocCatalogTree.UpdateCategoryNode(event, vm.catalogid);
        }
    };

    vm.categorySelected = function(categoryID) {
        vm.selectedCategoryID = categoryID;
        $state.go('categories.category.products', {categoryid: categoryID});
    };

    vm.createCategory = function(parentid){
        //parentid should be undefined at this point
        ocCatalog.CreateCategory(parentid, vm.catalogid)
            .then(function(newCategory) {
                newCategory.children = [];
                vm.tree.push(newCategory);
                vm.selectedCategoryID = newCategory.ID;
                $state.go('categories.category.products', {categoryid: newCategory.ID});
                toastr.success(newCategory.Name + ' was created.');
            });
    };

    function updateTree(originalID, updatedCategory, array, action) {
        var found = false;
        var catIndex;
        angular.forEach(array, function(category, index) {
            if (category.ID == originalID) {
                catIndex = index;
                found = true;
            }
        });
        if (found) {
            if (action == 'update') {
                array[catIndex] = updatedCategory;
                vm.selectedCategoryID = updatedCategory.ID;
                $state.go('categories.category.products', {categoryid: updatedCategory.ID}, {reload: 'categories.category.products'});
            }
            else if (action == 'delete') {
                array.splice(catIndex, 1);
                vm.selectedCategoryID = null;
            }
        }
        else {
            angular.forEach(array, function(category) {
                if (category.children && category.children.length) {
                    updateTree(originalID, updatedCategory, category.children, action);
                }
            });
        }
    }

    $rootScope.$on('CatalogViewManagement:CategoryIDChanged', function(e, categoryID){
        vm.selectedCategoryID = categoryID;
    });

    $rootScope.$on('CatalogManagement:CategoryUpdated', function(e, data) {
        updateTree(data.OriginalID, data.Category, vm.tree, 'update');
    });

    $rootScope.$on('CatalogManagement:CategoryDeleted', function(e, category) {
        updateTree(category.ID, category, vm.tree, 'delete');
    });
}