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
            data: {componentName: 'Admin User Groups'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AdminUserGroupList: function(OrderCloud, Parameters) {
                    return OrderCloud.AdminUserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('adminUserGroup', {
            parent: 'base',
            url: '/admin-user-groups/:adminusergroupid',
            templateUrl: 'adminUserGroups/templates/adminUserGroup.html',
            controller: 'AdminUserGroupCtrl',
            controllerAs: 'adminUserGroup',
            resolve: {
                SelectedAdminUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.AdminUserGroups.Get($stateParams.adminusergroupid);
                }
            }
        })
        /*.state('adminUserGroups.create', {
            url: '/create',
            templateUrl: 'adminUserGroups/templates/adminUserGroupCreate.tpl.html',
            controller: 'AdminUserGroupCreateCtrl',
            controllerAs: 'adminUserGroupCreate'
        })
        .state('adminUserGroups.assign', {
            url: '/:adminusergroupid/assign',
            templateUrl: 'adminUserGroups/templates/adminUserGroupAssign.tpl.html',
            controller: 'AdminUserGroupAssignCtrl',
            controllerAs: 'adminUserGroupAssign',
            resolve: {
                AdminUserList: function(OrderCloud) {
                    return OrderCloud.AdminUsers.List(null, 1, 20);
                },
                AssignedAdminUsers: function($stateParams, OrderCloud){
                    return OrderCloud.AdminUserGroups.ListUserAssignments($stateParams.adminusergroupid);
                },
                SelectedAdminUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.AdminUserGroups.Get($stateParams.adminusergroupid);
                }
            }
        })*/
    ;
}