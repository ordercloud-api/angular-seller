angular.module('orderCloud')
    .controller('CategoryViewTreeCtrl', CategoryViewTreeController)
;

function CategoryViewTreeController(toastr, $state, $stateParams, CatalogViewManagement, CategoryTreeService, CategoryModalFactory, Tree, CatalogID){
     var vm = this;
     vm.tree = Tree;
     vm.catalogid = CatalogID;
     vm.categorySelected = function(category){
         CatalogViewManagement.SetCategoryID(category, vm.catalogid);
         vm.selectedCategory = category;
     };

    if ($stateParams.preSelectID) {
        vm.categorySelected($stateParams.preSelectID);
    } else if (vm.tree[0] && vm.tree[0].ID) {
        vm.categorySelected(vm.tree[0].ID);
    }

    vm.treeOptions = {
        dropped: function(event) {
            CategoryTreeService.UpdateCategoryNode(event, vm.catalogid);
        }
    };

     vm.createCategory = function(parentid){
         CategoryModalFactory.Create(parentid, vm.catalogid)
             .then(function(newCategory) {
                 toastr.success(newCategory.Name + ' was created.');
                 //TODO: replace state reload with something less resource intensive
                 $state.go('catalogManagement', {buyerID: vm.catalogid, activeTab: 2}, {reload:true});
             });
     };
}