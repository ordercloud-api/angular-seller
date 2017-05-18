angular.module('orderCloud')
    .controller('RelatedProductCtrl', RelatedProductController)
;

function RelatedProductController(OrderCloudSDK, toastr, $state, $exceptionHandler, RelatedProductsList, SelectedProduct, Parameters, ocUtility) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.relatedProducts = RelatedProductsList;
    vm.parameters = Parameters;
    vm.selectedProducts = [];
    vm.uiSelectProducts;

    vm.removeRelatedProduct = removeRelatedProduct;
    vm.addRelatedProducts = addRelatedProducts;
    vm.listAllProducts = listAllProducts;
    vm.pageChanged = pageChanged;

    function removeRelatedProduct(relatedProduct) {
        var list = _.without(vm.product.xp.RelatedProducts, relatedProduct.ID);
        OrderCloudSDK.Products.Patch(vm.product.ID, {xp: {RelatedProducts: list}})
            .then(function() {
                vm.product.xp.RelatedProducts = list;
                toastr.success(relatedProduct.Name + ' was removed from Related Products', 'Success!')
            })
            .catch(function(error) {
                $exceptionHandler(error);
            })
            .finally(function(){
                $state.reload();
            });
    }

    function addRelatedProducts(products) {
        var filteredList = _.filter(products, function(productList) {
            return productList.ID !== vm.product.ID;
        });
        if(vm.product.xp && vm.product.xp.RelatedProducts && vm.product.xp.RelatedProducts.length) {
            var existingProducts = vm.product.xp.RelatedProducts;
            var productIDs = _.pluck(filteredList, 'ID');
            var relatedProductIDs = _.union(existingProducts, productIDs);

            OrderCloudSDK.Products.Patch(vm.product.ID, {xp: {RelatedProducts: relatedProductIDs}})
                .then(function() {
                    toastr.success('Product(s) added to Related Products', 'Success!')
                })
                .catch(function(error) {
                    $exceptionHandler(error);
                })
                .finally(function(){
                    $state.reload();
                });
        } else {
            var productIDs = _.pluck(filteredList, 'ID');

            OrderCloudSDK.Products.Patch(vm.product.ID, {xp: {RelatedProducts: productIDs}})
                .then(function() {
                    toastr.success('Product(s) added to Related Products', 'Success!')
                })
                .catch(function(error) {
                    $exceptionHandler(error);
                })
                .finally(function(){
                    $state.reload();
                });
        }
    }

    //TODO: fix to return all products
    function listAllProducts(product) {
        var parameters = {
            pageSize: 100,
            search: product
        };
        return ocUtility.ListAll(OrderCloudSDK.Products.List, parameters)
            .then(function(data){
                vm.uiSelectProducts = data;
            });
    }

    function pageChanged() {
        $state.go('.', {page:vm.relatedProducts.Meta.Page});
    }
}