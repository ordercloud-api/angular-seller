angular.module('orderCloud')
    .config(SellerUsersConfig)
;

function SellerUsersConfig($stateProvider) {
    $stateProvider
        .state('sellerUsers', {
            parent: 'base',
            templateUrl: 'sellerUsers/templates/sellerUsers.html',
            controller: 'SellerUsersCtrl',
            controllerAs: 'sellerUsers',
            url: '/seller-users?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Seller Users'
            },
            resolve : {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                SellerUsersList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.AdminUsers.List(Parameters);
                }
            }
        })
        .state('sellerUserGroup.users', {
            url: '/users?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'sellerUsers/templates/sellerUserGroupUsers.html',
            controller: 'SellerUserGroupUsersCtrl',
            controllerAs: 'sellerUserGroupUsers',
            data: {
                pageTitle: 'Seller User Group Members'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($stateParams, ocSellerUsers) {
                    return ocSellerUsers.Assignments.Get($stateParams.sellerusergroupid);
                },
                UserList: function(Parameters, CurrentAssignments, ocSellerUsers, OrderCloudSDK) {
                    return OrderCloudSDK.AdminUsers.List(Parameters)
                        .then(function(data) {
                            return ocSellerUsers.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        });
}