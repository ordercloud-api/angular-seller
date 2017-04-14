angular.module('orderCloud')
    .config(OrderApprovalsConfig)
;

function OrderApprovalsConfig($stateProvider) {
    $stateProvider
        .state('orderDetail.approvals', {
            url: '/approvals',
            templateUrl: 'orderManagement/approvals/templates/orderApprovals.html',
            controller: 'OrderApprovalsCtrl',
            controllerAs: 'orderApprovals',
            data: {
                pageTitle: 'Order Approvals'
            },
            resolve: {
                OrderApprovals: function($stateParams, ocOrderApprovalsService) {
                    return ocOrderApprovalsService.List($stateParams.orderid, $stateParams.buyerid, 1, 100);
                }
            }
        })
    ;
}