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
        .state('address', {
            parent: 'buyer',
            params: {
                addressModel: undefined
            },
            url: '/addresses/:addressid',
            templateUrl: 'addresses/templates/address.html',
            controller: 'AddressCtrl',
            controllerAs: 'address',
            resolve: {
                SelectedAddress: function($stateParams, OrderCloud) {
                    if ($stateParams.addressModel) {
                        return $stateParams.addressModel;
                    } else {
                        return OrderCloud.Addresses.Get($stateParams.addressid, $stateParams.buyerid);
                    }
                }
            }
        })
}