angular.module('orderCloud')
    .controller('CostCenterCreateModalCtrl', CostCenterCreateModalController)
;

function CostCenterCreateModalController($uibModalInstance, sdkOrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.costCenter = {};

    vm.submit = function() {
        vm.loading = sdkOrderCloud.CostCenters.Create(SelectedBuyerID, vm.costCenter)
            .then(function(newCostCenter) {
                $uibModalInstance.close(newCostCenter);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}