angular.module('orderCloud')
    .controller('CostCenterEditModalCtrl', CostCenterEditModalController)
;

function CostCenterEditModalController($uibModalInstance, OrderCloud, SelectedCostCenter, SelectedBuyerID) {
    var vm = this;
    vm.costCenter = angular.copy(SelectedCostCenter);
    vm.costCenterName = SelectedCostCenter.Name;

    vm.submit = function() {
        vm.loading = OrderCloud.CostCenters.Update(SelectedCostCenter.ID, vm.costCenter, SelectedBuyerID)
            .then(function(updatedCostCenter) {
                $uibModalInstance.close(updatedCostCenter);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}