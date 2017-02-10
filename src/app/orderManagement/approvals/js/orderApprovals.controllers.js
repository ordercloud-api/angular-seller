angular.module('orderCloud')
    .controller('OrderApprovalsCtrl', OrderApprovalsController)
;

function OrderApprovalsController(OrderApprovals) {
    var vm = this;
    vm.list = OrderApprovals;

    vm.pageChanged = function() {
        ocOrderApprovalsService.List($stateParams.orderid, $stateParams.buyerid, vm.list.Meta.Page, vm.list.Meta.PageSize)
            .then(function(data) {
                vm.list = data;
            });
    };

    vm.loadMore = function() {
        vm.list.Meta.Page++;
        ocOrderApprovalsService.List($stateParams.orderid, $stateParams.buyerid, vm.list.Meta.Page, vm.list.Meta.PageSize)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}