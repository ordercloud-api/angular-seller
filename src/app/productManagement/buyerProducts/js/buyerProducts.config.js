angular.module('orderCloud')
    .config(BuyerProductsConfig);

function BuyerProductsConfig($stateProvider) {
    $stateProvider
        .state('buyerProducts', {
            parent: 'buyer',
            url: '/products?search&page&pageSize&searchOn&sortBy&filters&catalogID',
            templateUrl: 'productManagement/buyerProducts/templates/buyerProducts.html',
            controller: 'BuyerProductsCtrl',
            controllerAs: 'buyerProducts',
            resolve: {
                Parameters: function ($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function ($stateParams, ocProductPricing) {
                    return ocProductPricing.Assignments.Get(null, null, $stateParams.buyerid);
                },
                ProductList: function (OrderCloudSDK, Parameters) {
                    Parameters.filters = angular.extend(Parameters.filters, {
                        Active: true
                    });
                    return OrderCloudSDK.Products.List(Parameters);
                },
                MappedProductList: function ($stateParams, ocProductPricing, ProductList, CurrentAssignments) {
                    return ocProductPricing.GetProductListPriceSchedules(ProductList, CurrentAssignments)
                        .then(function(data) {
                            return ocProductPricing.Assignments.Map($stateParams.buyerid, null, ProductList, data, CurrentAssignments);
                        });
                }
            }
        });
}