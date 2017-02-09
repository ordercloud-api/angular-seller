angular.module('orderCloud')
    .directive('ocOrderPaymentsPurchaseOrder', OCOrderPaymentsPurchaseOrder)
;

function OCOrderPaymentsPurchaseOrder() {
    return {
        restrict: 'E',
        scope: {
            payment: '='
        },
        templateUrl: 'orderManagement/payments/directives/templates/orderPaymentsPurchaseOrder.html'
    }
}