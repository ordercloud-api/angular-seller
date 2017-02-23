angular.module('orderCloud')
    .config(AddressesConfig)
;

function AddressesConfig($stateProvider){
    $stateProvider
        .state('addresses', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/addresses/templates/addresses.html',
            controller: 'AddressesCtrl',
            controllerAs: 'addresses',
            url: '/addresses?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Addresses'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocAddresses, $stateParams) {
                    return ocAddresses.Assignments.Get('company', $stateParams.buyerid);
                },
                AddressList: function(ocAddresses, OrderCloud, Parameters, CurrentAssignments) {
                    return OrderCloud.Addresses.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            return ocAddresses.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
        .state('userGroup.addresses', {
            templateUrl: 'buyerManagement/addresses/templates/addresses.html',
            controller: 'AddressesCtrl',
            controllerAs: 'addresses',
            url: '/addresses?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'User Group Addresses'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocAddresses, $stateParams) {
                    return ocAddresses.Assignments.Get('group', $stateParams.buyerid, $stateParams.usergroupid);
                },
                AddressList: function(ocAddresses, OrderCloud, Parameters, CurrentAssignments) {
                    return OrderCloud.Addresses.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            return ocAddresses.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
}