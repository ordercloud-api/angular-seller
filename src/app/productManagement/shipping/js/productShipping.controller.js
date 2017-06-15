angular.module('orderCloud')
    .controller('ProductShippingCtrl', ProductShippingController)
;

function ProductShippingController($state, $timeout, toastr, OrderCloudSDK, SelectedShippingAddress) {
    var vm = this;
    vm.updateProductShipping = updateProductShipping;
    vm.listSellerAddresses = listSellerAddresses;
    vm.selectAddress = selectAddress;
    vm.searchTerm = SelectedShippingAddress;
    vm.hideNoResults = hideNoResults;

    function updateProductShipping(product) {
        var partial = _.pick(product, ['ShipWeight', 'ShipHeight', 'ShipWidth', 'ShipLength', 'ShipFromAddressID']);
        vm.productUpdateLoading = OrderCloudSDK.Products.Patch(product.ID, partial)
            .then(function() {
                vm.ProductShippingForm.$setPristine();
                toastr.success(product.Name + ' shipping was updated');
                $state.go('.', {}, {reload:'product', notify:false});
            });
    }

    function listSellerAddresses(search) {
        return OrderCloudSDK.AdminAddresses.List({search: search})
            .then(function(data){
                return data.Items;
            });
    }

    function selectAddress(item, model, label, event, productModel) {
        productModel.ShipFromAddressID = item.ID;
    }

    function hideNoResults() {
        $timeout(function() {
            vm.noResults = false;
        }, 100);
    }
}