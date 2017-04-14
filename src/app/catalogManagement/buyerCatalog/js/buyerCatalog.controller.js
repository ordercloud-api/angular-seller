angular.module('orderCloud')
    .controller('BuyerCatalogCtrl', BuyerCatalogController)
;

function BuyerCatalogController($q, $exceptionHandler, $stateParams, toastr, ocCatalog, ocCatalogTree, ocCatalogCategories, SelectedBuyer, SelectedCatalog, CategoryAssignments, CategoryList, CatalogAssignment, Tree) {
    var vm = this;
    vm.viewAllCategories = CatalogAssignment.ViewAllCategories;
    vm.viewAllProducts = CatalogAssignment.ViewAllProducts;
    vm.selectedCatalog = SelectedCatalog;
    vm.tree = Tree;
    
    vm.updateCategoryAssignment = function(node) {
        if (node.Assigned) {
            node.loading = ocCatalogCategories.Assignments.Save($stateParams.catalogid, node.ID, $stateParams.buyerid, $stateParams.usergroupid)
                .then(function() {
                    toastr.success('Category ' + node.Name + ' was assigned to ' + SelectedBuyer.Name);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    node.Assigned = false;
                })
        } else {
            node.loading = ocCatalogCategories.Assignments.Delete($stateParams.catalogid, node.ID, $stateParams.buyerid, $stateParams.usergroupid)
                .then(function() {
                    toastr.success('Category ' + node.Name + ' was unassigned from ' + SelectedBuyer.Name);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    node.Assigned = true;
                })
        }
    }

    vm.updateCatalogAssignment = function(type) {
        var df = $q.defer();
        vm.loading = df.promise;
        ocCatalog.Assignments.UpdateAssignment($stateParams.catalogid, $stateParams.buyerid, {ViewAllCategories: vm.viewAllCategories, ViewAllProducts:vm.viewAllProducts})
            .then(function(updatedAssignment) {
                if (type == 'categories') {
                    ocCatalogTree.Get(ocCatalogCategories.Assignments.Map(CategoryList, updatedAssignment.viewAllCategories ? true : CategoryAssignments))
                        .then(function(updatedTree) {
                            vm.tree = updatedTree;
                            df.resolve();
                            toastr.success('View all categories ' + (updatedAssignment.viewAllCategories ? ' enabled' : ' disabled'));
                        })
                } else {
                    df.resolve();
                    toastr.success('View all products ' + (updatedAssignment.viewAllProducts ? ' enabled' : ' disabled'));
                }
                
            });
    };
}