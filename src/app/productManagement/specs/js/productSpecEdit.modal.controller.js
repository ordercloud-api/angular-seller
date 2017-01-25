angular.module('orderCloud')
    .controller('ProductSpecEditModalCtrl', ProductSpecEditModalController)
;

function ProductSpecEditModalController($uibModalInstance, SelectedSpec, OrderCloud) {
    var vm = this;
    vm.spec = angular.copy(SelectedSpec);

    vm.submit = function() {
        vm.loading = OrderCloud.Specs.Update(SelectedSpec.ID, vm.spec)
            .then(function(updatedSpec) {
                $uibModalInstance.close(updatedSpec);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}