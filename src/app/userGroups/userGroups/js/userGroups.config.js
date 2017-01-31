angular.module('orderCloud')
    .config(UserGroupsConfig)
;

function UserGroupsConfig($stateProvider) {
    $stateProvider
        .state('userGroups', {
            parent: 'buyer',
            templateUrl: 'userGroups/userGroups/templates/userGroups.html',
            controller: 'UserGroupsCtrl',
            controllerAs: 'userGroups',
            url: '/user-groups?search&page&pageSize&searchOn&sortBy&filters',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserGroupList: function(OrderCloud, Parameters) {
                    return OrderCloud.UserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
    ;
}