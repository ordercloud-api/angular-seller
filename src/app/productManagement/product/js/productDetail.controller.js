angular.module('orderCloud')
    .controller('ProductDetailCtrl', ProductDetailController)
;

function ProductDetailController($rootScope, $state, toastr, OrderCloud, ocProducts, SelectedProduct) {
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
                toastr.success(data.Name + ' was updated');
            })
    }

    function deleteProduct(){
        ocProducts.Delete(SelectedProduct)
            .then(function() {
                toastr.success(SelectedProduct.Name + ' was deleted.');
                $state.go('products', {}, {reload: true});
            });
    }

    $rootScope.$on('ProductManagement:SpecCountChanged', function(event, action) {
        vm.product.SpecCount += (action == 'increment') ? 1 : -1;
    });
}