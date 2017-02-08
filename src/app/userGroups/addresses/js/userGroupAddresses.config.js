angular.module('orderCloud')
    .config(UserGroupAddressesConfig)
;

function UserGroupAddressesConfig($stateProvider){
    $stateProvider
        .state('userGroup.addresses', {
            templateUrl: 'addresses/templates/addresses.html',
            controller: 'AddressesCtrl',
            controllerAs: 'addresses',
            url: '/addresses?search&page&pageSize&searchOn&sortBy&filters',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
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
        .state('userGroup.address', {
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