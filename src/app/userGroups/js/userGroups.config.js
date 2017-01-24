angular.module('orderCloud')
    .config(UserGroupsConfig)
    .controller('UserGroupEditCtrl', UserGroupEditController)
;

function UserGroupsConfig($stateProvider) {
    $stateProvider
        .state('userGroups', {
            parent: 'buyer',
            templateUrl: 'userGroups/templates/userGroups.html',
            controller: 'UserGroupsCtrl',
            controllerAs: 'userGroups',
            url: '/usergroups?search&page&pageSize&searchOn&sortBy&filters',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserGroupList: function(OrderCloud, Parameters) {
                    return OrderCloud.UserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
        .state('userGroups.detail', {
            url: '/:usergroupid',
            templateUrl: 'userGroups/templates/userGroupDetail.html',
            controller: 'UserGroupDetailCtrl',
            controllerAs: 'userGroupDetail',
            resolve: {
                SelectedUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.usergroupid, $stateParams.buyerid);
                },
                AssignedUsers: function($stateParams, OrderCloud) {
                    return OrderCloud.Users.List($stateParams.usergroupid, null, null, null, null, null, null, $stateParams.buyerid);

                }
            }
        })
        .state('userGroups.create', {
            url: '/create',
            templateUrl: 'userGroups/templates/userGroupCreate.tpl.html',
            controller: 'UserGroupCreateCtrl',
            controllerAs: 'userGroupCreate',
            resolve: {
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                }
            }
        })
        .state('userGroups.assign', {
            url: '/:usergroupid/assign',
            templateUrl: 'userGroups/templates/userGroupAssign.tpl.html',
            controller: 'UserGroupAssignCtrl',
            controllerAs: 'userGroupAssign',
            resolve: {
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserList: function(OrderCloud) {
                    return OrderCloud.Users.List(null, null, 1, 20);
                },
                AssignedUsers: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.ListUserAssignments($stateParams.usergroupid);
                },
                SelectedUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.usergroupid);
                }
            }
        })
    ;
}

function UserGroupEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedUserGroup) {
    var vm = this,
        groupID = SelectedUserGroup.ID;
    vm.userGroupName = SelectedUserGroup.Name;
    vm.userGroup = SelectedUserGroup;

    vm.Submit = function() {
        OrderCloud.UserGroups.Update(groupID, vm.userGroup)
            .then(function() {
                $state.go('userGroups', {}, {reload: true});
                toastr.success('User Group Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.UserGroups.Delete(SelectedUserGroup.ID)
            .then(function() {
                $state.go('userGroups', {}, {reload: true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}