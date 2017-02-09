angular.module('orderCloud')
    .directive('ocOrderPaymentsCreditCard', OCOrderPaymentsCreditCard)
;

function OCOrderPaymentsCreditCard() {
    return {
        restrict: 'E',
        scope: {
            payment: '='
        },
        templateUrl: 'orderManagement/payments/directives/templates/orderPaymentsCreditCard.html'
    }
}