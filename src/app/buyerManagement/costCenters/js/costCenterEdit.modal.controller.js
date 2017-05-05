angular.module('orderCloud')
    .controller('CostCenterEditModalCtrl', CostCenterEditModalController)
;

function CostCenterEditModalController($uibModalInstance, OrderCloudSDK, SelectedCostCenter, SelectedBuyerID) {
    var vm = this;
    vm.costCenter = angular.copy(SelectedCostCenter);
    vm.costCenterName = SelectedCostCenter.Name;

    vm.submit = function() {
        vm.loading = OrderCloudSDK.CostCenters.Update(SelectedBuyerID, SelectedCostCenter.ID, vm.costCenter)
            .then(function(updatedCostCenter) {
                $uibModalInstance.close(updatedCostCenter);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}