angular.module('orderCloud')
    .config(CreditCardsConfig)
;

function CreditCardsConfig($stateProvider) {
    $stateProvider
        .state('creditCards', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/creditCards/templates/creditCards.html',
            controller: 'CreditCardsCtrl',
            controllerAs: 'creditCards',
            url: '/credit-cards?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Credit Cards'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function(ocCreditCards, $stateParams) {
                    return ocCreditCards.Assignments.Get('company', $stateParams.buyerid);
                },
                CreditCardList: function(OrderCloud, Parameters, CurrentAssignments, ocCreditCards) {
                    return OrderCloud.CreditCards.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            return ocCreditCards.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
        .state('userGroup.creditCards', {
            templateUrl: 'buyerManagement/creditCards/templates/creditCards.html',
            controller: 'CreditCardsCtrl',
            controllerAs: 'creditCards',
            url: '/credit-cards?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'User Group Credit Cards'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocCreditCards, $stateParams) {
                    return ocCreditCards.Assignments.Get('group', $stateParams.buyerid, $stateParams.usergroupid);
                },
                CreditCardList: function(OrderCloud, Parameters, CurrentAssignments, ocCreditCards) {
                    return OrderCloud.CreditCards.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            return ocCreditCards.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
}