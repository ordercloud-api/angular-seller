angular.module('orderCloud')
    .config(ProductCreateConfig)
    .controller('ProductCreateCtrl', ProductCreateController)
;

function ProductCreateConfig($stateProvider) {
    $stateProvider

        .state('products.create', {
            url: '/create',
            templateUrl: 'productManagement/createProduct/templates/createProduct.html',
            controller: 'ProductCreateCtrl',
            controllerAs: 'productCreate'

        })

}

function ProductCreateController($exceptionHandler, $state, toastr, OrderCloud) {
    var vm = this;

    vm.product = {};
    vm.product.Active = true;
    vm.product.QuantityMultiplier = 1;

    vm.submit = submit;

    function submit() {
        OrderCloud.Products.Create(vm.product)
            .then(function(data) {
                vm.product.ID = data.ID;
                toastr.success('Product Saved', 'Success');
                $state.go('products.detail.createAssignment', {productid: vm.product.ID}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}


