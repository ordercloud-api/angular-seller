angular.module('orderCloud')
    .config(UserGroupCreditCardsConfig)
;

function UserGroupCreditCardsConfig($stateProvider){
    $stateProvider
        .state('userGroup.creditCards', {
            templateUrl: 'creditCards/templates/creditCards.html',
            controller: 'CreditCardsCtrl',
            controllerAs: 'creditCards',
            url: '/credit-cards?search&page&pageSize&searchOn&sortBy&filters',
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