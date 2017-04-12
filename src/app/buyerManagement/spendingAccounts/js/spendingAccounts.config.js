angular.module('orderCloud')
    .config(SpendingAccountsConfig)
;

function SpendingAccountsConfig($stateProvider) {
    $stateProvider
        .state('spendingAccounts', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/spendingAccounts/templates/spendingAccounts.html',
            controller: 'SpendingAccountsCtrl',
            controllerAs: 'spendingAccounts',
            url: '/spending-accounts?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Spending Accounts'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocSpendingAccounts, $stateParams) {
                    return ocSpendingAccounts.Assignments.Get('company', $stateParams.buyerid);
                },
                SpendingAccountList: function($stateParams, OrderCloudSDK, Parameters, CurrentAssignments, ocSpendingAccounts) {
                    var parameters = angular.copy(Parameters);
                    parameters.filters = angular.extend((parameters.filters || {}), {RedemptionCode: '!*'});
                    return OrderCloudSDK.SpendingAccounts.List($stateParams.buyerid, parameters)
                        .then(function(data) {
                            return ocSpendingAccounts.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
        .state('userGroup.spendingAccounts', {
            templateUrl: 'buyerManagement/spendingAccounts/templates/spendingAccounts.html',
            controller: 'SpendingAccountsCtrl',
            controllerAs: 'spendingAccounts',
            url: '/spending-accounts?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'User Group Spending Accounts'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocSpendingAccounts, $stateParams) {
                    return ocSpendingAccounts.Assignments.Get('group', $stateParams.buyerid, $stateParams.usergroupid);
                },
                SpendingAccountList: function($stateParams, OrderCloudSDK, Parameters, CurrentAssignments, ocSpendingAccounts) {
                    var parameters = angular.copy(Parameters);
                    parameters.filters = angular.extend((parameters.filters || {}), {RedemptionCode: '!*'});
                    return OrderCloudSDK.SpendingAccounts.List($stateParams.buyerid, parameters)
                        .then(function(data) {
                            return ocSpendingAccounts.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
    ;
}