angular.module('orderCloud')
    .controller('OrderPaymentsCtrl', OrderPaymentsController)
;

function OrderPaymentsController($stateParams, ocOrderPaymentsService, OrderPayments) {
    var vm = this;
    vm.list = OrderPayments;

    vm.pageChanged = function() {
        ocOrderPaymentsService.List($stateParams.orderid, $stateParams.buyerid, vm.list.Meta.Page, vm.list.Meta.PageSize)
            .then(function(data) {
                vm.list = data;
            });
    };

    vm.loadMore = function() {
        vm.list.Meta.Page++;
        ocOrderPaymentsService.List($stateParams.orderid, $stateParams.buyerid, vm.list.Meta.Page, vm.list.Meta.PageSize)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}