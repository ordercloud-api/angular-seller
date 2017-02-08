angular.module('orderCloud')
    .config(AdminUserGroupSecurityConfig)
;

function AdminUserGroupSecurityConfig($stateProvider) {
    $stateProvider
        .state('adminUserGroup.security', {
            url: '/security',
            templateUrl: 'adminUserGroups/security/templates/adminUserGroupSecurity.html',
            controller: 'AdminUserGroupSecurityCtrl',
            controllerAs: 'adminUserGroupSecurity',
            resolve: {
                Parameters: function(OrderCloudParameters, $stateParams) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AvailableProfiles: function($q, OrderCloud) {
                    return OrderCloud.SecurityProfiles.List(null, null, 100, null, null, {IsDevProfile:false});
                },
                Assignments: function(Parameters, OrderCloud) {
                    return OrderCloud.SecurityProfiles.ListAssignments(null, null, Parameters.adminusergroupid, null, null, 100);
                }
            }
        })
    ;
}