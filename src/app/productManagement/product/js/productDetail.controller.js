angular.module('orderCloud')
    .controller('ProductDetailCtrl', ProductDetailController)
;

function ProductDetailController($rootScope, $exceptionHandler, $state, toastr, OrderCloud, ocConfirm, SelectedProduct) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.inventoryEnabled = angular.copy(SelectedProduct.InventoryEnabled);
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;
    vm.patchImage = patchImage;

    function patchImage(imageXP){
       return OrderCloud.Products.Patch(vm.product.ID, {xp: imageXP});
    }

    function updateProduct() {
        var partial = _.pick(vm.product, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'InventoryEnabled']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(SelectedProduct.ID, partial)
            .then(function(data) {
                vm.product = angular.copy(data);
                vm.productName = angular.copy(data.Name);
                vm.inventoryEnabled = angular.copy(data.InventoryEnabled);
                SelectedProduct = data;
                vm.InfoForm.$setPristine();
                toastr.success(data.Name + ' was updated', 'Success!');
            })
    }

    function deleteProduct(){
        ocConfirm.Confirm({
                message:'Are you sure you want to delete this product?'
            })
            .then(function(){
                OrderCloud.Products.Delete(SelectedProduct.ID)
                    .then(function() {
                        toastr.success('Product Deleted', 'Success');
                        $state.go('products', {}, {reload: true});
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex)
                    });
            });
    }

    $rootScope.$on('ProductManagement:SpecCountChanged', function(event, action) {
        vm.product.SpecCount += (action == 'increment') ? 1 : -1;
    });
}