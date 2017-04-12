angular.module('orderCloud')
    .controller('CostCenterCreateModalCtrl', CostCenterCreateModalController)
;

function CostCenterCreateModalController($uibModalInstance, OrderCloudSDK, SelectedBuyerID) {
    var vm = this;
    vm.costCenter = {};

    vm.submit = function() {
        vm.loading = OrderCloudSDK.CostCenters.Create(SelectedBuyerID, vm.costCenter)
            .then(function(newCostCenter) {
                $uibModalInstance.close(newCostCenter);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}