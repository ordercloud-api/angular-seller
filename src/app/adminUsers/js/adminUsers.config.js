angular.module('orderCloud')
    .config(AdminUsersConfig)
;

function AdminUsersConfig($stateProvider) {
    $stateProvider
        .state('adminUsers', {
            parent: 'base',
            templateUrl: 'adminUsers/templates/adminUsers.html',
            controller: 'AdminUsersCtrl',
            controllerAs: 'adminUsers',
            url: '/admin-users?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Admin Users'
            },
            resolve : {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                AdminUsersList: function(OrderCloud, Parameters) {
                    return OrderCloud.AdminUsers.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('adminUserGroup.users', {
            url: '/users?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'adminUsers/templates/adminUserGroupUsers.html',
            controller: 'AdminUserGroupUsersCtrl',
            controllerAs: 'adminUserGroupUsers',
            data: {
                pageTitle: 'Admin User Group Members'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($stateParams, ocAdminUsers) {
                    return ocAdminUsers.Assignments.Get($stateParams.adminusergroupid);
                },
                UserList: function(Parameters, CurrentAssignments, ocAdminUsers, OrderCloud) {
                    return OrderCloud.AdminUsers.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
                        .then(function(data) {
                            return ocAdminUsers.Assignments.Map(CurrentAssignments, data);
                        })
                }
            }
        })
}