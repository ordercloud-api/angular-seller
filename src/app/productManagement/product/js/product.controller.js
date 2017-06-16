angular.module('orderCloud')
    .controller('ProductCtrl', ProductController);

function ProductController($exceptionHandler, $rootScope, $state, toastr, OrderCloudSDK, ocProducts, ocNavItems, ocRelatedProducts, ocProductPricing, SelectedProduct) {
    var vm = this;
    vm.model = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.inventoryEnabled = angular.copy(SelectedProduct.Inventory ? SelectedProduct.Inventory.Enabled : false);
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;
    vm.createDefaultPrice = createDefaultPrice;
    
    vm.navigationItems = ocNavItems.Filter(ocNavItems.Product());

    vm.fileUploadOptions = {
        keyname: 'image',
        srcKeyname: 'URL',
        folder: null,
        extensions: 'jpg, png, gif, jpeg, tiff',
        invalidExtensions: null,
        onUpdate: patchImage,
        multiple: false,
        addText: 'Upload an image',
        replaceText: 'Replace'
    };

    function patchImage(imageXP) {
        return OrderCloudSDK.Products.Patch(vm.model.ID, {
            xp: imageXP
        })
        .then(function() {
            toastr.success('Images successfully updated', 'Success');
            $state.go('.', {}, {reload: 'product', notify:false});
        })
        .catch(function(ex) {
            $exceptionHandler(ex);
        });
    }

    vm.descriptionToolbar = [
        ['html', 'bold', 'italics', 'underline', 'strikeThrough'],
        ['h1', 'h2', 'h3', 'p'],
        ['ul', 'ol'],
        ['insertLink', 'insertImage', 'insertVideo']
    ];

    function updateProduct() {
        var currentPrice = angular.copy(vm.model.DefaultPriceSchedule);
        var partial = _.pick(vm.model, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'Inventory', 'Active']);
        var partialXP = _.pick(vm.model.xp, ['Featured']);
        partial.xp = partialXP;

        vm.loading = OrderCloudSDK.Products.Patch(SelectedProduct.ID, partial)
            .then(function (data) {

                //Account for changes in ID
                if (data.ID !== SelectedProduct.ID) {
                    $state.go('.', {productid: data.ID}, {notify: false});

                    //Sync other products that have this product in xp.RelatedProducts array
                    //This only makes API calls if the product has related products
                    ocRelatedProducts.Sync(data.xp.RelatedProducts, data.ID, SelectedProduct.ID);
                }

                //Update the view model
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
                vm.form.$setPristine();
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

    $rootScope.$on('OC:DefaultPriceUpdated', function (event, newID) {
        vm.model.DefaultPriceScheduleID = newID;
    });
}