angular.module('orderCloud')
    .config(UserGroupSecurityConfig)
;

function UserGroupSecurityConfig($stateProvider) {
    $stateProvider
        .state('userGroup.security', {
            url: '/security',
            templateUrl: 'userGroups/security/templates/userGroupSecurity.html',
            controller: 'UserGroupSecurityCtrl',
            controllerAs: 'userGroupSecurity',
            resolve: {
                Parameters: function(OrderCloudParameters, $stateParams) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AvailableProfiles: function($q, OrderCloud) {
                    return OrderCloud.SecurityProfiles.List(null, null, 100, null, null, {IsDevProfile:false});
                },
                Assignments: function(Parameters, OrderCloud) {
                    return OrderCloud.SecurityProfiles.ListAssignments(null, null, Parameters.usergroupid, null, null, 100, Parameters.buyerid);
                }
            }
        })
    ;
}