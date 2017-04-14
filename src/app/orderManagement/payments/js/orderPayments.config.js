angular.module('orderCloud')
    .config(OrderPaymentsConfig)
;

function OrderPaymentsConfig($stateProvider) {
    $stateProvider
        .state('orderDetail.payments', {
            url: '/payments',
            templateUrl: 'orderManagement/payments/templates/orderPayments.html',
            controller: 'OrderPaymentsCtrl',
            controllerAs: 'orderPayments',
            data: {
                pageTitle: 'Order Payments'
            },
            resolve: {
                OrderPayments: function($stateParams, ocOrderPaymentsService) {
                    return ocOrderPaymentsService.List($stateParams.orderid, $stateParams.buyerid, 1, null);
                }
            }
        })
    ;
}