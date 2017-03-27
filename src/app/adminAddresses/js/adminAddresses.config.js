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
                pageTitle: 'Admin Addresses'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                AddressList: function(sdkOrderCloud, Parameters) {
                    return sdkOrderCloud.AdminAddresses.List(Parameters);
                }
            }
        })
}