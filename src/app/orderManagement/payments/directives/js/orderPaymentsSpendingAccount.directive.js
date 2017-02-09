angular.module('orderCloud')
    .directive('ocOrderPaymentsSpendingAccount', OCOrderPaymentsSpendingAccount)
;

function OCOrderPaymentsSpendingAccount() {
    return {
        restrict: 'E',
        scope: {
            payment: '='
        },
        templateUrl: 'orderManagement/payments/directives/templates/orderPaymentsSpendingAccount.html'
    }
}