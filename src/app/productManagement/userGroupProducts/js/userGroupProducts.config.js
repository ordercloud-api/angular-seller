angular.module('orderCloud')
    .config(UserGroupProductsConfig);

function UserGroupProductsConfig($stateProvider) {
    $stateProvider
        .state('userGroupProducts', {
            parent: 'userGroup',
            url: '/products?search&page&pageSize&searchOn&sortBy&filters&catalogID',
            templateUrl: 'productManagement/userGroupProducts/templates/userGroupProducts.html',
            controller: 'UserGroupProductsCtrl',
            controllerAs: 'userGroupProducts',
            resolve: {
                Parameters: function ($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                BuyerProductAssignments: function ($stateParams, ocProductPricing) {
                    return ocProductPricing.Assignments.Get(null, 'company', $stateParams.buyerid);
                },
                UserGroupProductAssignments: function($stateParams, ocProductPricing) {
                    return ocProductPricing.Assignments.Get(null, 'group', $stateParams.usergroupid, $stateParams.buyerid, $stateParams.usergroupid);
                },
                ProductList: function (OrderCloudSDK, Parameters) {
                    Parameters.filters = angular.extend(Parameters.filters, {
                        Active: true
                    });
                    return OrderCloudSDK.Products.List(Parameters);
                },
                MappedProductList: function ($stateParams, ocProductPricing, ProductList, BuyerProductAssignments, UserGroupProductAssignments) {
                    return ocProductPricing.GetProductListPriceSchedules(ProductList, BuyerProductAssignments, UserGroupProductAssignments)
                        .then(function(data) {
                            return ocProductPricing.Assignments.Map($stateParams.buyerid, $stateParams.usergroupid, ProductList, data, BuyerProductAssignments, UserGroupProductAssignments);
                        });
                }
            }
        });
}