angular.module('orderCloud')
    .controller('ProductSpecCreateCtrl', ProductSpecCreateController)
;

function ProductSpecCreateController($uibModalInstance, $exceptionHandler, toastr, OrderCloudSDK, ProductID) {
    var vm = this;

    vm.submit = function() {
        vm.loading = OrderCloudSDK.Specs.Create(vm.spec)
            .then(function(data) {
                var assignment = {productID: ProductID, specID: data.ID};
                OrderCloudSDK.Specs.SaveProductAssignment(assignment)
                    .then(function() {
                        assignment.Spec = data;
                        toastr.success('Spec: ' + data.Name + ' created');
                        $uibModalInstance.close(assignment);
                    });
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}
