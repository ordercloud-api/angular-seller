angular.module('orderCloud')
    .controller('OrderCtrl', OrderController)
;

function OrderController(SelectedOrder) {
    var vm = this;
    vm.order = SelectedOrder;
}