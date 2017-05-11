angular.module('orderCloud')
    .controller('ProductCategoriesCtrl', ProductCategoriesController)
;

function ProductCategoriesController($exceptionHandler, $stateParams, toastr, ocProductCategories, ocCatalog, SelectedCatalog, Tree, SelectedProduct) {
    var vm = this;
    vm.selectedCatalog = SelectedCatalog;
    vm.selectedProduct = SelectedProduct;
    vm.tree = Tree;
    vm.catalogid = $stateParams.catalogid;

    vm.updateAssignment = function(node) {
        if (node.Assigned) {
            node.loading = ocProductCategories.Assignments.Save($stateParams.catalogid, node.ID, $stateParams.productid)
                .then(function() {
                    toastr.success(vm.selectedProduct.Name + ' was assigned to ' + node.Name);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    node.Assigned = false;
                });
        } else {
            node.loading = ocProductCategories.Assignments.Delete($stateParams.catalogid, node.ID, $stateParams.productid)
                .then(function() {
                    toastr.success(vm.selectedProduct.Name + ' was unassigned from ' + node.Name);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    node.Assigned = true;
                });
        }
    };
}