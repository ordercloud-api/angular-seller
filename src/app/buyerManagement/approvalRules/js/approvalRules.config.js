angular.module('orderCloud')
    .config(ApprovalRulesConfig)
;

function ApprovalRulesConfig($stateProvider) {
    $stateProvider
        .state('approvalRules', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/approvalRules/templates/approvalRules.html',
            controller: 'ApprovalRulesCtrl',
            controllerAs: 'approvalRules',
            url: '/approval-rules?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Approval Rules'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                ApprovalRuleList: function(OrderCloud, Parameters) {
                    return OrderCloud.ApprovalRules.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
    ;
}