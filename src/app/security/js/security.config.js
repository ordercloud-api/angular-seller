angular.module('orderCloud')
    .config(SecurityConfig)
;

function SecurityConfig($stateProvider) {
    $stateProvider
        .state('security', {
            parent: 'base',
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            data: {
                pageTitle: 'Admin Security'
            },
            resolve: {
                Assignments: function(sdkOrderCloud) {
                    return sdkOrderCloud.SecurityProfiles.ListAssignments({level:"company", pageSize:100, commerceRole:'seller'});
                },
                AvailableProfiles: function($q, sdkOrderCloud, Assignments) {
                    return sdkOrderCloud.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.pluck(Assignments.Items, 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
        .state('adminUserGroup.security', {
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            data: {
                pageTitle: 'Admin User Group Security'
            },
            resolve: {
                Assignments: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.SecurityProfiles.ListAssignments({level:'group', pageSize:100, userGroupID:$stateParams.adminusergroupid, commerceRole:'seller'});
                },
                AvailableProfiles: function($q, sdkOrderCloud, Assignments) {
                    return sdkOrderCloud.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.pluck((Assignments.Items), 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
        .state('buyerSecurity', {
            parent: 'buyer',
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            data: {
                pageTitle: 'Buyer Security'
            },
            resolve: {
                Assignments: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.SecurityProfiles.ListAssignments({level:'company', pageSize:100, buyerID:$stateParams.buyerid, commerceRole:'buyer'});
                },
                AvailableProfiles: function($q, sdkOrderCloud, Assignments) {
                    return sdkOrderCloud.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.pluck(Assignments.Items, 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
        .state('userGroup.security', {
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            data: {
                pageTitle: 'User Group Security'
            },
            resolve: {
                Assignments: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.SecurityProfiles.ListAssignments({level:'group', pageSize:100, userGroupID:$stateParams.usergroupid, commerceRole:'buyer'});
                },
                AvailableProfiles: function($q, sdkOrderCloud, Assignments) {
                    return sdkOrderCloud.SecurityProfiles.List({pageSize:100})
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
