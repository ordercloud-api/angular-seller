angular.module('orderCloud')
    .config(OrderApprovalsConfig)
;

function OrderApprovalsConfig($stateProvider) {
    $stateProvider
        .state('orderDetail.approvals', {
            url: '/approvals',
            templateUrl: 'orderManagement/approvals/templates/orderApprovals.html',
            controller: 'OrderApprovalsCtrl',
            controllerAs: 'orderApprovals'
        })
    ;
}