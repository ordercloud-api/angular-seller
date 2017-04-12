angular.module('orderCloud')
    .config(UsersConfig)
;

function UsersConfig($stateProvider) {
    $stateProvider
        .state('users', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/users/templates/users.html',
            controller: 'UsersCtrl',
            controllerAs: 'users',
            url: '/users?userGroupID&search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Users'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                UserList: function(OrderCloudSDK, $stateParams, Parameters) {
                    return OrderCloudSDK.Users.List($stateParams.buyerid, Parameters);
                }
            }
        })
        .state('userGroup.users', {
            url: '/users?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'buyerManagement/users/templates/userGroupUsers.html',
            controller: 'UserGroupUsersCtrl',
            controllerAs: 'userGroupUsers',
            data: {
                pageTitle: 'User Group Members'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($stateParams, ocUsers) {
                    return ocUsers.Assignments.Get($stateParams.buyerid, $stateParams.usergroupid);
                },
                UserList: function($stateParams, Parameters, CurrentAssignments, ocUsers, OrderCloudSDK) {
                    return OrderCloudSDK.Users.List($stateParams.buyerid, Parameters)
                        .then(function(data) {
                            return ocUsers.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
    ;
}