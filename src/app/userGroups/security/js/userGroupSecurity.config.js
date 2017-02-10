angular.module('orderCloud')
    .config(UserGroupSecurityConfig)
;

function UserGroupSecurityConfig($stateProvider) {
    $stateProvider
        .state('userGroup.security', {
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            resolve: {
                Assignments: function($stateParams, OrderCloud) {
                    return OrderCloud.SecurityProfiles.ListAssignments(null, null, $stateParams.usergroupid, 'group', null, 100, $stateParams.buyerid);
                },
                AvailableProfiles: function($q, OrderCloud, Assignments) {
                    return OrderCloud.SecurityProfiles.List(null, null, 100, null, null, {IsDevProfile:false})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.pluck(Assignments.Items, 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
    ;
}