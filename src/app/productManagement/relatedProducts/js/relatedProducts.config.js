angular.module('orderCloud')
    .config(RelatedProductConfig)
;

function RelatedProductConfig($stateProvider) {
    $stateProvider
        .state('product.relatedProducts', {
            url: '/related-products?page&pageSize',
            templateUrl: 'productManagement/relatedProducts/templates/relatedProducts.html',
            controller: 'RelatedProductCtrl',
            controllerAs: 'relatedProduct',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                RelatedProductsList: function(OrderCloudSDK, SelectedProduct, Parameters) {
                    if (SelectedProduct.xp && SelectedProduct.xp.RelatedProducts && SelectedProduct.xp.RelatedProducts.length) {
                        var parameters = {
                            filters: {
                                ID: SelectedProduct.xp.RelatedProducts.join('|')
                            },
                            pageSize: 15,
                            page: Parameters.page || 1
                        };
                        return OrderCloudSDK.Products.List(parameters);
                    } else {
                        return {Items: []}
                    }
                }
            }
        })
    ;
}