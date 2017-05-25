angular.module('orderCloud')
    .controller('RelatedProductsCtrl', RelatedProductsController)
;

function RelatedProductsController($q, OrderCloudSDK, toastr, $state, $exceptionHandler, ProductsList, SelectedProduct, Parameters) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.products = ProductsList;
    vm.parameters = Parameters;

    vm.updateProduct = updateProduct;
    vm.pageChanged = pageChanged;
    vm.loadMore = loadMore;

    function updateProduct(product) {
        var relatedArr,
            message;
        if (product.Related) {
            if (vm.product.xp && vm.product.xp.RelatedProducts && vm.product.xp.RelatedProducts.length) {
                relatedArr = vm.product.xp.RelatedProducts;
                relatedArr.push(product.ID);
            } else {
                related = product.ID;
            }
            message = product.Name + ' was added to related products';
        } else {
            relatedArr = _.without(vm.product.xp.RelatedProducts, product.ID);
            message = product.Name + ' was removed from Related Products';
        }
        OrderCloudSDK.Products.Patch(vm.product.ID, {xp: {RelatedProducts: relatedArr}})
            .then(function() {
                toastr.success(message, 'Success')
            })
            .catch(function(error) {
                $exceptionHandler(error);
            })
    }

    function pageChanged() {
        $state.go('product.relatedProducts', {page: vm.products.Meta.Page}, {reload: true});
    }

    function loadMore() {
        var parameters = angular.extend(Parameters, {page: vm.products.Meta.Page + 1, filters: {ID: vm.product.xp.RelatedProducts.join('|')}});
        return OrderCloudSDK.Products.List(parameters)
            .then(function(data) {
                vm.products.Items = vm.products.Items.concat(data.Items);
                vm.products.Meta = data.Meta;
            });
    }
}