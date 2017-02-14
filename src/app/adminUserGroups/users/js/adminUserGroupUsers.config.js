angular.module('orderCloud')
    .config(AdminUserGroupUsersConfig)
;

function AdminUserGroupUsersConfig($stateProvider) {
    $stateProvider
        .state('adminUserGroup.users', {
            url: '/users?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'adminUserGroups/users/templates/adminUserGroupUsers.html',
            controller: 'AdminUserGroupUsersCtrl',
            controllerAs: 'adminUserGroupUsers',
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
    ;
}