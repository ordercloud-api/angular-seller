angular.module('orderCloud')
    .controller('CostCenterCreateModalCtrl', CostCenterCreateModalController)
;

function CostCenterCreateModalController($uibModalInstance, OrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.costCenter = {};

    vm.submit = function() {
        vm.loading = OrderCloud.CostCenters.Create(vm.costCenter, SelectedBuyerID)
            .then(function(newCostCenter) {
                $uibModalInstance.close(newCostCenter);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}