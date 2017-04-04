angular.module('orderCloud')
    .controller('ProductDetailCtrl', ProductDetailController)
;

function ProductDetailController($rootScope, $state, toastr, OrderCloud, ocProducts, ocProductPricing, SelectedProduct) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.inventoryEnabled = angular.copy(SelectedProduct.Inventory ? SelectedProduct.Inventory.Enabled : false);
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;
    vm.patchImage = patchImage;
    vm.createDefaultPrice = createDefaultPrice;

    function patchImage(imageXP){
       return OrderCloud.Products.Patch(vm.product.ID, {xp: imageXP});
    }

    function updateProduct() {
        var currentPrice = angular.copy(vm.product.DefaultPriceSchedule);
        var partial = _.pick(vm.product, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'Inventory', 'Active']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(SelectedProduct.ID, partial)
            .then(function(data) {
                vm.product = angular.copy(data);
                vm.product.DefaultPriceSchedule = currentPrice;
                vm.productName = angular.copy(data.Name);
                vm.inventoryEnabled = angular.copy(data.InventoryEnabled);
                SelectedProduct = data;
                vm.InfoForm.$setPristine();
                toastr.success(data.Name + ' was updated');
            });
    }

    function deleteProduct(){
        ocProducts.Delete(SelectedProduct)
            .then(function() {
                toastr.success(SelectedProduct.Name + ' was deleted.');
                $state.go('products', {}, {reload: true});
            });
    }

    function createDefaultPrice() {
        ocProductPricing.CreateProductPrice(vm.product, null, null, null, true)
            .then(function(data) {
                toastr.success('Default price was successfully added to ' + vm.product.Name);
                $state.go('productDetail.pricing.priceScheduleDetail', {pricescheduleid: data.SelectedPrice.ID}, {reload: true});
            });
    }

    $rootScope.$on('ProductManagement:SpecCountChanged', function(event, action) {
        vm.product.SpecCount += (action == 'increment') ? 1 : -1;
    });
}