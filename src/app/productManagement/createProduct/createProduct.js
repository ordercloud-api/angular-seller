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
    vm.productCreated = false;

    vm.submit = submit;

    function submit() {
        if(vm.productCreated){
            OrderCloud.Products.Update(vm.product.ID ,vm.product)
                .then(function(data) {
                    toastr.success('Product Saved', 'Click next to assign prices');
                    $state.go('products.createAssignment', {productid: vm.product.ID, fromstate: "productCreate"}, {reload: true});
                })
                .catch(function(ex) {
                    $exceptionHandler(ex)
                });
        } else {
            OrderCloud.Products.Create(vm.product)
                .then(function(data) {
                    vm.product.ID = data.ID;
                    vm.productCreated = true;
                    toastr.success('Product Saved', 'Click next to assign prices');
                    $state.go('products.createAssignment', {productid: vm.product.ID, fromstate: "productCreate"}, {reload: true});
                })
                .catch(function(ex) {
                    $exceptionHandler(ex)
                });
        }
    };
}


