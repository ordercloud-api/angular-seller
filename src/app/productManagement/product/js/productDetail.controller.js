angular.module('orderCloud')
    .controller('ProductDetailCtrl', ProductDetailController)
;

function ProductDetailController($rootScope, $state, toastr, OrderCloud, ocConfirm, SelectedProduct) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    var hasImage = (SelectedProduct.xp && SelectedProduct.xp.image && SelectedProduct.xp.image.URL);
    vm.inventoryEnabled = angular.copy(SelectedProduct.InventoryEnabled);
    vm.popularProduct = SelectedProduct && SelectedProduct.xp && SelectedProduct.xp.Featured;
    vm.isPopular = vm.popularProduct && SelectedProduct.xp.Featured === true;

    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;
    vm.patchImage = patchImage;
    vm.popularProductToggle = popularProductToggle;

    function patchImage(imageXP){
       return OrderCloud.Products.Patch(vm.product.ID, {xp: imageXP});
    }

    function updateProduct() {
        var partial = _.pick(vm.product, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'InventoryEnabled']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(SelectedProduct.ID, partial)
            .then(function(data) {
                var product = angular.copy(data);
                toastr.success(data.Name + ' was updated', 'Success!');
                $state.go('productDetail', {productid: product.ID}, {reload: true});
            })
    }

    function deleteProduct(){
        ocConfirm.Confirm({
                message:'Are you sure you want to delete this product?'+
                '<br> ' +
                '<b>This action cannot be undone.</b> '
            })
            .then(function(){
                OrderCloud.Products.Delete(SelectedProduct.ID)
                    .then(function() {
                        if (hasImage) {
                            var split = SelectedProduct.xp.image.URL.split('/');
                            var key = split[split.length - 1];
                            ocFilesService.Delete(key);
                        }
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

    function popularProductToggle() {
        if(vm.popularProduct) {
            if(vm.isPopular) {
                removeProduct();
            } else {
                addProduct();
            }
        } else {
            addProduct();
        }
        function addProduct() {
            OrderCloud.Products.Patch(SelectedProduct.ID, {xp: {Featured: true}})
                .then(function() {
                    vm.isPopular = true;
                    toastr.success(SelectedProduct.Name + ' was added to Popular Products', 'Success!');
                });
        }
        function removeProduct() {
            OrderCloud.Products.Patch(SelectedProduct.ID, {xp: {Featured: false}})
                .then(function() {
                    vm.isPopular = false;
                    toastr.success(SelectedProduct.Name + ' was removed from Popular Products', 'Success!');
                });
        }
    }
}