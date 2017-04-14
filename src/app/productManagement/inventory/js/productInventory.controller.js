angular.module('orderCloud')
    .controller('ProductInventoryCtrl', ProductInventoryController)
;

function ProductInventoryController($exceptionHandler, toastr, ocProductInventory, SelectedProduct) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.updateProductInventory = updateProductInventory;

    function updateProductInventory(product) {
        vm.loading = ocProductInventory.Update(product)
            .then(function(updatedProduct) {
                vm.product = angular.copy(updatedProduct);
                vm.ProductInventoryForm.$setPristine();
                toastr.success(updatedProduct.Name + ' inventory was updated');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            })
    }
}