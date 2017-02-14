angular.module('orderCloud')
    .config(UserGroupSpendingAccountsConfig)
;

function UserGroupSpendingAccountsConfig($stateProvider){
    $stateProvider
        .state('userGroup.spendingAccounts', {
            templateUrl: 'spendingAccounts/templates/spendingAccounts.html',
            controller: 'SpendingAccountsCtrl',
            controllerAs: 'spendingAccounts',
            url: '/spending-accounts?search&page&pageSize&searchOn&sortBy&filters',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocSpendingAccounts, $stateParams) {
                    return ocSpendingAccounts.Assignments.Get('group', $stateParams.buyerid, $stateParams.usergroupid);
                },
                SpendingAccountList: function(OrderCloud, Parameters, CurrentAssignments, ocSpendingAccounts) {
                    var parameters = angular.copy(Parameters);
                    parameters.filters = angular.extend((parameters.filters || {}), {RedemptionCode: '!*'});
                    return OrderCloud.SpendingAccounts.List(parameters.search, parameters.page, parameters.pageSize, parameters.searchOn, parameters.sortBy, parameters.filters, parameters.buyerid)
                        .then(function(data) {
                            return ocSpendingAccounts.Assignments.Map(CurrentAssignments, data);
                        })
                }
            }
        })
}