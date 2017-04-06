angular.module('orderCloud')
    .config(SellerAddressesConfig)
;

function SellerAddressesConfig($stateProvider){
    $stateProvider
        .state('sellerAddresses', {
            parent: 'base',
            templateUrl: 'sellerAddresses/templates/sellerAddresses.html',
            controller: 'SellerAddressesCtrl',
            controllerAs: 'sellerAddresses',
            url: '/seller-addresses?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Seller Addresses'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                AddressList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.AdminAddresses.List(Parameters);
                }
            }
        });
}