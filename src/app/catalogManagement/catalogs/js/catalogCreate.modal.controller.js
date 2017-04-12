angular.module('orderCloud')
    .controller('CatalogCreateModalCtrl', CatalogCreateModalController)
;

function CatalogCreateModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK) {
    var vm = this;
    vm.catalog = {
        ID:null,
        Name:null,
        Description:null,
        Active:true
    };
    vm.updateValidity = updateValidity;
    vm.submit = submit;
    vm.cancel = $uibModalInstance.dismiss;

    function updateValidity() {
        if (vm.form.ID.$error['UnavailableID']) vm.form.ID.$setValidity('UnavailableID', true);
    }
    
    function submit() {
        vm.loading = OrderCloudSDK.Catalogs.Create(vm.catalog)
            .then(function(newCatalog) {
                $uibModalInstance.close(newCatalog);
            })
            .catch(function(ex) {
                if (ex.status === 409) {
                    vm.form.ID.$setValidity('UnavailableID', false);
                    vm.form.ID.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    }
}