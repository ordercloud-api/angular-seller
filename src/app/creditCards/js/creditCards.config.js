angular.module('orderCloud')
    .config(CreditCardsConfig)
;

function CreditCardsConfig($stateProvider) {
    $stateProvider
        .state('creditCards', {
            parent: 'buyer',
            templateUrl: 'creditCards/templates/creditCards.html',
            controller: 'CreditCardsCtrl',
            controllerAs: 'creditCards',
            url: '/creditcards?search&page&pageSize&searchOn&sortBy&filters',
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
}