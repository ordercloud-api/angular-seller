angular.module('orderCloud')
    .config(AdminUserGroupConfig)
;

function AdminUserGroupConfig($stateProvider) {
    $stateProvider
        .state('adminUserGroup', {
            parent: 'base',
            url: '/admin-user-groups/:adminusergroupid',
            templateUrl: 'adminUserGroups/adminUserGroup/templates/adminUserGroup.html',
            controller: 'AdminUserGroupCtrl',
            controllerAs: 'adminUserGroup',
            resolve: {
                SelectedAdminUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.AdminUserGroups.Get($stateParams.adminusergroupid);
                }
            }
        })
    ;
}