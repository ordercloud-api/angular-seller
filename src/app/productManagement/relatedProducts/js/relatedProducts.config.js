angular.module('orderCloud')
    .config(RelatedProductConfig)
;

function RelatedProductConfig($stateProvider) {
    $stateProvider
        .state('product.relatedProducts', {
            url: '/related-products?page&pageSize',
            templateUrl: 'productManagement/relatedProducts/templates/relatedProducts.html',
            controller: 'RelatedProductsCtrl',
            controllerAs: 'relatedProducts',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                ProductsList: function(OrderCloudSDK, SelectedProduct, Parameters) {
                    return OrderCloudSDK.Products.List(Parameters)
                        .then(function(products) {
                            if (SelectedProduct.xp && SelectedProduct.xp.RelatedProducts && SelectedProduct.xp.RelatedProducts.length) {
                                var relatedProductIDs = SelectedProduct.xp.RelatedProducts;
                                    _.each(relatedProductIDs, function(id) {
                                        var related = _.pluck(products.Items, 'ID').indexOf(id) > -1;
                                        if (related) {
                                            var relatedProduct = _.findWhere(products.Items, {ID: id});
                                            relatedProduct.Related = true;
                                            return relatedProduct;
                                        }
                                    })
                                    var index = products.Items.findIndex(function(product) {
                                        return product.ID === SelectedProduct.ID;
                                    })
                                    products.Items.splice(index, 1);
                                    return products;
                            } else {
                                return products;
                            }
                        })
                }
            }
        })
    ;
}