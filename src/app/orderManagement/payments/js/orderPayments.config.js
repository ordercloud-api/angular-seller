angular.module('orderCloud')
    .config(OrderPaymentsConfig)
;

function OrderPaymentsConfig($stateProvider) {
    $stateProvider
        .state('orderDetail.payments', {
            url: '/payments',
            templateUrl: 'orderManagement/payments/templates/orderPayments.html',
            controller: 'OrderPaymentsCtrl',
            controllerAs: 'orderPayments'
        })
    ;
}