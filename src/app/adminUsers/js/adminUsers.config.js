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
            url: '/admin-users?search&page&pageSize&searchOn&sortBy&filters',
            resolve : {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                AdminUsersList: function(OrderCloud, Parameters) {
                    return OrderCloud.AdminUsers.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
}