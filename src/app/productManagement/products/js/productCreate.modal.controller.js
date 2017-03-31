angular.module('orderCloud')
    .controller('ProductCreateModalCtrl', ProductCreateModalController)
;

function ProductCreateModalController($uibModalInstance, ocProducts, OrderCloud) {
    var vm = this;
    vm.product = {};
    vm.product.Active = true;
    vm.product.QuantityMultiplier = 1;

    vm.submit = submit;
    vm.cancel = cancel;
    vm.patchImage = patchImage;

    function patchImage(imageXP){
        return OrderCloud.Products.Patch(vm.product.ID, imageXP);
    }

    function submit() {
        vm.loading = OrderCloud.Products.Create(vm.product)
            .then(function(data) {
                if (angular.isDefined(vm.product.DefaultPrice)) {
                    data.DefaultPrice = vm.product.DefaultPrice;
                    ocProducts.CreateDefaultPrice(data)
                        .then(function(product) {
                            $uibModalInstance.close(product);
                        });
                } else {
                    $uibModalInstance.close(data);
                }
                
            });
    }

    function cancel() {
        return $uibModalInstance.dismiss();
    }
}