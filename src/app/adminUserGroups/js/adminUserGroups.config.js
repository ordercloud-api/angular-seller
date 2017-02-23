angular.module('orderCloud')
    .config(AdminUserGroupsConfig)
;

function AdminUserGroupsConfig($stateProvider) {
    $stateProvider
        .state('adminUserGroups', {
            parent: 'base',
            templateUrl: 'adminUserGroups/templates/adminUserGroups.html',
            controller: 'AdminUserGroupsCtrl',
            controllerAs: 'adminUserGroups',
            url: '/admin-user-groups?search&page&pageSize&sortBy&searchOn&filters',
            data: {
                pageTitle: 'Admin User Groups'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                AdminUserGroupList: function(OrderCloud, Parameters) {
                    return OrderCloud.AdminUserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('adminUserGroup', {
            parent: 'base',
            url: '/admin-user-groups/:adminusergroupid',
            templateUrl: 'adminUserGroups/templates/adminUserGroup.html',
            controller: 'AdminUserGroupCtrl',
            controllerAs: 'adminUserGroup',
            data: {
                pageTitle: 'Admin User Group'
            },
            resolve: {
                SelectedAdminUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.AdminUserGroups.Get($stateParams.adminusergroupid);
                }
            }
        })
    ;
}