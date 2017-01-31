angular.module('orderCloud')
    .config(UserGroupMembersConfig)
;

function UserGroupMembersConfig($stateProvider) {
    $stateProvider
        .state('userGroup.members', {
            url: '/members?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'userGroups/members/templates/userGroupMembers.html',
            controller: 'UserGroupMembersCtrl',
            controllerAs: 'userGroupMembers',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserMembers: function(Parameters, OrderCloud) {
                    return OrderCloud.Users.List(Parameters.usergroupid, Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
    ;
}