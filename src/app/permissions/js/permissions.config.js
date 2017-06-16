angular.module('orderCloud')
    .config(PermissionsConfig)
;

function PermissionsConfig($stateProvider) {
    $stateProvider
        .state('permissions', {
            parent: 'base',
            url: '/permissions',
            templateUrl: 'permissions/templates/permissions.html',
            controller: 'PermissionsCtrl',
            controllerAs: 'permissions',
            data: {
                pageTitle: 'Seller Permissions',
                message: 'Each permission enabled at this level will be inherited by <em>all seller users</em> within <b>{{application.name()}}</b>.'
            },
            resolve: {
                Assignments: function(OrderCloudSDK) {
                    return OrderCloudSDK.SecurityProfiles.ListAssignments({level:'company', pageSize:100, commerceRole:'seller'});
                },
                AvailableProfiles: function($q, OrderCloudSDK, Assignments) {
                    return OrderCloudSDK.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.map(Assignments.Items, 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
        .state('sellerUserGroup.permissions', {
            url: '/permissions',
            templateUrl: 'permissions/templates/permissions.html',
            controller: 'PermissionsCtrl',
            controllerAs: 'permissions',
            data: {
                pageTitle: 'Seller User Group Permissions',
                message: 'Each permission enabled at this level will be inherited by <em>all seller users</em> within <b>{{sellerUserGroup.group.Name}}</b>.'
            },
            resolve: {
                Assignments: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.SecurityProfiles.ListAssignments({level:'group', pageSize:100, userGroupID:$stateParams.adminusergroupid, commerceRole:'seller'});
                },
                AvailableProfiles: function($q, OrderCloudSDK, Assignments) {
                    return OrderCloudSDK.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.map((Assignments.Items), 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
        .state('buyerPermissions', {
            parent: 'buyer',
            url: '/permissions',
            templateUrl: 'permissions/templates/permissions.html',
            controller: 'PermissionsCtrl',
            controllerAs: 'permissions',
            data: {
                pageTitle: 'Buyer Permissions',
                message: 'Each permission enabled at this level will be inherited by <em>all buyer users</em> within <b>{{buyer.selectedBuyer.Name}}</b>.'
            },
            resolve: {
                Assignments: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.SecurityProfiles.ListAssignments({level:'company', pageSize:100, buyerID:$stateParams.buyerid, commerceRole:'buyer'});
                },
                AvailableProfiles: function($q, OrderCloudSDK, Assignments) {
                    return OrderCloudSDK.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.map(Assignments.Items, 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
        .state('userGroup.permissions', {
            url: '/permissions',
            templateUrl: 'permissions/templates/permissions.html',
            controller: 'PermissionsCtrl',
            controllerAs: 'permissions',
            data: {
                pageTitle: 'User Group Permissions',
                message: 'Each permission enabled at this level will be inherited by <em>all buyer users</em> within <b>{{userGroup.group.Name}}</b>.'
            },
            resolve: {
                Assignments: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.SecurityProfiles.ListAssignments({level:'group', pageSize:100, userGroupID:$stateParams.usergroupid, commerceRole:'buyer'});
                },
                AvailableProfiles: function($q, OrderCloudSDK, Assignments) {
                    return OrderCloudSDK.SecurityProfiles.List({pageSize:100})
                        .then(function(data) {
                            return _.map(data.Items, function(sp) {
                                sp.selected = _.map(Assignments.Items, 'SecurityProfileID').indexOf(sp.ID) > -1;
                                return sp;
                            });
                        });
                }
            }
        })
    ;
}
