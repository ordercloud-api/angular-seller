angular.module('orderCloud')
    .controller('ProductShippingCtrl', ProductShippingController)
;

function ProductShippingController(toastr, OrderCloudSDK, ocRoles) {
    var vm = this;
    vm.updateProductShipping = updateProductShipping;
    vm.listAllAdminAddresses = listAllAdminAddresses;

    function updateProductShipping(product) {
        var partial = _.pick(product, ['ShipWeight', 'ShipHeight', 'ShipWidth', 'ShipLength', 'ShipFromAddressID']);
        vm.productUpdateLoading = OrderCloudSDK.Products.Patch(product.ID, partial)
            .then(function() {
                vm.ProductShippingForm.$setPristine();
                toastr.success(product.Name + ' shipping was updated');
            });
    }

    function listAllAdminAddresses(search){
        if (ocRoles.UserIsAuthorized(['AddressAdmin'])) {
            return OrderCloudSDK.AdminAddresses.List({search: search})
                .then(function(data){
                    vm.sellerAddresses = data;
                });
        }
    }
}