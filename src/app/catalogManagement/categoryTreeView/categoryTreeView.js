angular.module('orderCloud')
    .controller('CategoryViewTreeCtrl', CategoryViewTreeController)
;

function CategoryViewTreeController(CatalogViewManagement, CategoryModalFactory, Tree, CatalogID){
     var vm = this;
     vm.tree = Tree;
     vm.catalogid = CatalogID;
     vm.categorySelected = function(category){
         CatalogViewManagement.SetCategoryID(category, vm.catalogid);
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