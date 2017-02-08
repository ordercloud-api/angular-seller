angular.module('orderCloud')
    .config(AdminAddressesConfig)
;

function AdminAddressesConfig($stateProvider){
    $stateProvider
        .state('adminAddresses', {
            parent: 'base',
            templateUrl: 'adminAddresses/templates/adminAddresses.html',
            controller: 'AdminAddressesCtrl',
            controllerAs: 'adminAddresses',
            url: '/admin-addresses?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                componentName: 'Admin Addresses'
            },
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AddressList: function(OrderCloud, Parameters) {
                    return OrderCloud.AdminAddresses.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
}