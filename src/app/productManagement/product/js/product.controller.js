angular.module('orderCloud')
    .controller('ProductCtrl', ProductController);

function ProductController($rootScope, $state, toastr, OrderCloudSDK, ocProducts, ocNavItems, ocProductPricing, SelectedProduct) {
    var vm = this;
    vm.model = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.inventoryEnabled = angular.copy(SelectedProduct.Inventory ? SelectedProduct.Inventory.Enabled : false);
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;
    vm.patchImage = patchImage;
    vm.createDefaultPrice = createDefaultPrice;
    
    vm.navigationItems = ocNavItems.Filter(ocNavItems.Product());

    function patchImage(imageXP) {
        return OrderCloudSDK.Products.Patch(vm.model.ID, {
            xp: imageXP
        });
    }

    function updateProduct() {
        var currentPrice = angular.copy(vm.model.DefaultPriceSchedule);
        var partial = _.pick(vm.model, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'Inventory', 'Active']);
        vm.modelUpdateLoading = OrderCloudSDK.Products.Patch(SelectedProduct.ID, partial)
            .then(function (data) {

                vm.model = angular.copy(data);
                if (currentPrice && data.Name !== SelectedProduct.Name) {
                    OrderCloudSDK.PriceSchedules.Patch(currentPrice.ID, {
                            Name: data.Name + ' Default Price'
                        })
                        .then(function (updatedPrice) {
                            vm.model.DefaultPriceSchedule = updatedPrice;
                        });
                } else {
                    vm.model.DefaultPriceSchedule = currentPrice;
                }
                vm.productName = angular.copy(data.Name);
                vm.inventoryEnabled = angular.copy(data.InventoryEnabled);
                SelectedProduct = data;
                vm.InfoForm.$setPristine();
                toastr.success(data.Name + ' was updated');
            });
    }

    function deleteProduct() {
        ocProducts.Delete(SelectedProduct)
            .then(function () {
                toastr.success(SelectedProduct.Name + ' was deleted.');
                $state.go('products', {}, {
                    reload: true
                });
            });
    }

    function createDefaultPrice() {
        ocProductPricing.CreateProductPrice(vm.model, null, null, null, true)
            .then(function (data) {
                toastr.success('Default price was successfully added to ' + vm.model.Name);
                $state.go('product.pricing.priceScheduleDetail', {
                    pricescheduleid: data.SelectedPrice.ID
                }, {
                    reload: true
                });
            });
    }

    $rootScope.$on('ProductManagement:SpecCountChanged', function (event, action) {
        vm.model.SpecCount += (action == 'increment') ? 1 : -1;
    });

    $rootScope.$on('OC:DefaultPriceUpdated', function (event, newID) {
        vm.model.DefaultPriceScheduleID = newID;
    });
}