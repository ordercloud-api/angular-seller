angular.module('orderCloud')
    .config(AddressesConfig)
;

function AddressesConfig($stateProvider){
    $stateProvider
        .state('addresses', {
            parent: 'buyer',
            templateUrl: 'addresses/templates/addresses.html',
            controller: 'AddressesCtrl',
            controllerAs: 'addresses',
            url: '/addresses?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                componentName: 'Admin Addresses'
            },
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AddressList: function(OrderCloud, Parameters) {
                    return OrderCloud.Addresses.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
}