angular.module('orderCloud')
    .config(AdminUsersConfig)
;

function AdminUsersConfig($stateProvider) {
    $stateProvider
        .state('adminUsers', {
            parent: 'base',
            templateUrl: 'adminUsers/templates/adminUsers.html',
            controller: 'AdminUsersCtrl',
            controllerAs: 'adminUsers',
            url: '/users?search&page&pageSize&searchOn&sortBy&filters',
            resolve : {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AdminUsersList: function(OrderCloud, Parameters) {
                    return OrderCloud.AdminUsers.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
}