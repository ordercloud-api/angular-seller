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
                ApprovalRuleList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.ApprovalRules.List(Parameters.buyerid, Parameters);
                }
            }
        })
    ;
}