angular.module('orderCloud')
    .controller('ProductShippingCtrl', ProductShippingController)
;

function ProductShippingController(toastr, OrderCloud, ocRolesService) {
    var vm = this;
    vm.updateProductShipping = updateProductShipping;
    vm.listAllAdminAddresses = listAllAdminAddresses;

    function updateProductShipping(product) {
        var partial = _.pick(product, ['ShipWeight', 'ShipHeight', 'ShipWidth', 'ShipLength', 'ShipFromAddressID']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(product.ID, partial)
            .then(function() {
                vm.ProductShippingForm.$setPristine();
                toastr.success(product.Name + ' shipping was updated');
            });
    }

    function listAllAdminAddresses(search){
        if (ocRolesService.UserIsAuthorized(['AddressAdmin'])) {
            return OrderCloud.AdminAddresses.List(search)
                .then(function(data){
                    vm.adminAddresses = data;
                });
        }
    }
}