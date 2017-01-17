angular.module('orderCloud')
    .controller('CategoryViewTreeCtrl', CategoryViewTreeController)
;

function CategoryViewTreeController(CatalogViewManagement, CategoryTreeService, CategoryModalFactory, Tree, CatalogID){
     var vm = this;
     vm.tree = Tree;
     vm.catalogid = CatalogID;
     vm.categorySelected = function(category){
         CatalogViewManagement.SetCategoryID(category, vm.catalogid);
         vm.selectedCategory = category;
     };

    vm.treeOptions = {
        dropped: function(event) {
            CategoryTreeService.UpdateCategoryNode(event, vm.catalogid);
        }
    };

     vm.createCategory = function(parentid){
         CategoryModalFactory.Create(parentid, vm.catalogid);
     };
}