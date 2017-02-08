angular.module('orderCloud')
    .config(UsersConfig)
;

function UsersConfig($stateProvider) {
    $stateProvider
        .state('users', {
            parent: 'buyer',
            templateUrl: 'users/templates/users.html',
            controller: 'UsersCtrl',
            controllerAs: 'users',
            url: '/users?userGroupID&search&page&pageSize&searchOn&sortBy&filters',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserList: function(OrderCloud, Parameters) {
                    return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
    ;
}