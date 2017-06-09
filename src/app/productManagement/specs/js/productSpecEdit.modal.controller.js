angular.module('orderCloud')
    .controller('ProductSpecEditModalCtrl', ProductSpecEditModalController)
;

function ProductSpecEditModalController($uibModalInstance, $exceptionHandler, OrderCloudSDK, SelectedSpec) {
    var vm = this;
    vm.spec = angular.copy(SelectedSpec);
    vm.specName = SelectedSpec.Name;

    vm.submit = function() {
        if (vm.spec.DefaultValue === '') vm.spec.DefaultValue = null; //Prevent blank strings in the DefaultValue
        vm.loading = OrderCloudSDK.Specs.Update(SelectedSpec.ID, vm.spec)
            .then(function(updatedSpec) {
                $uibModalInstance.close(updatedSpec);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}