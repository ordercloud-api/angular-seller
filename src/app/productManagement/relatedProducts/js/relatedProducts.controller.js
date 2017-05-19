angular.module('orderCloud')
    .controller('RelatedProductCtrl', RelatedProductController)
;

function RelatedProductController($q, OrderCloudSDK, toastr, $state, $exceptionHandler, RelatedProductsList, SelectedProduct, Parameters) {
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

    function listAllProducts(product) {
        var page = 1;
        var parameters = {
            pageSize: 100,
            page: page,
            search: product
        };
        return OrderCloudSDK.Products.List(parameters)
            .then(function(data){
                vm.uiSelectProducts = data;
                var queue = [];
                if(data.Meta.TotalPages > data.Meta.Page) {
                    page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        parameters.page = page;
                        queue.push(OrderCloudSDK.Products.List(parameters));
                    }
                }
                return $q.all(queue)
                    .then(function(allProducts) {
                        _.each(allProducts, function(productArr) {
                            vm.uiSelectProducts.Items = [].concat(vm.uiSelectProducts.Items, productArr.Items);
                            vm.uiSelectProducts.Meta = productArr.Meta;
                        });
                        return vm.uiSelectProducts;
                    })
            });
    }

    function pageChanged() {
        $state.go('product.relatedProducts', {page:vm.relatedProducts.Meta.Page}, {reload: true});
    }
}