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
                AdminUserGroupList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.AdminUserGroups.List(Parameters);
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
                SelectedAdminUserGroup: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.AdminUserGroups.Get($stateParams.adminusergroupid);
                }
            }
        })
    ;
}