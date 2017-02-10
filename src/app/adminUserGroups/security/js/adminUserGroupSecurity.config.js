angular.module('orderCloud')
    .config(AdminUserGroupSecurityConfig)
;

function AdminUserGroupSecurityConfig($stateProvider) {
    $stateProvider
        .state('adminUserGroup.security', {
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            resolve: {
                Assignments: function($stateParams, OrderCloud) {
                    return OrderCloud.SecurityProfiles.ListAssignments(null, null, $stateParams.adminusergroupid, 'group', null, 100, null);
                },
                AvailableProfiles: function($q, OrderCloud, Assignments) {
                    return OrderCloud.SecurityProfiles.List(null, null, 100, null, null, {IsDevProfile:false})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.pluck((Assignments.Items), 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
    ;
}