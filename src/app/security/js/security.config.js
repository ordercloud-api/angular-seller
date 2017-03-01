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
                Assignments: function(OrderCloud) {
                    return OrderCloud.SecurityProfiles.ListAssignments(null, null, null, 'company', null, 100, null);
                },
                AvailableProfiles: function($q, OrderCloud, Assignments) {
                    return OrderCloud.SecurityProfiles.List(null, null, 100, null, null, {IsDevProfile:false})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.pluck(_.filter(Assignments.Items, {BuyerID:null}), 'SecurityProfileID').indexOf(sp.ID) > -1;
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
                Assignments: function($stateParams, OrderCloud) {
                    return OrderCloud.SecurityProfiles.ListAssignments(null, null, null, 'company', null, 100, $stateParams.buyerid);
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
        .state('userGroup.security', {
            url: '/security',
            templateUrl: 'security/templates/security.html',
            controller: 'SecurityCtrl',
            controllerAs: 'security',
            data: {
                pageTitle: 'User Group Security'
            },
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
