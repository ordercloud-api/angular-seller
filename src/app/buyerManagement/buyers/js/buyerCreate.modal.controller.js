angular.module('orderCloud')
    .controller('BuyerCreateModalCtrl', BuyerCreateModalController)
;

function BuyerCreateModalController($uibModalInstance, $exceptionHandler, OrderCloudSDK) {
    var vm = this;
    vm.submit = submit;
    vm.cancel = cancel;
    vm.searchCatalogs = searchCatalogs;
    vm.updateValidity = updateValidity;
    vm.buyer = {
        UseExistingCatalog: true
    };

    function updateValidity(which) {
        if (which === 'BuyerID' && vm.form.ID.$error['UnavailableID']) vm.form.ID.$setValidity('UnavailableID', true);
        if (which === 'CatalogID' && vm.form.NewCatalogID.$error['UnavailableID']) vm.form.NewCatalogID.$setValidity('UnavailableID', true);
    }

    function submit() {
        if (vm.buyer.UseExistingCatalog) {
            vm.buyer.DefaultCatalogID = vm.buyer.SelectedDefaultCatalog.ID;
            vm.loading = saveBuyer(vm.buyer);
        } else {
            vm.loading = saveCatalog(vm.defaultCatalog);
        }

        function saveCatalog(catalogModel) {
            return OrderCloudSDK.Catalogs.Create(catalogModel)
                .then(function(newCatalog) {
                    vm.buyer.DefaultCatalogID = newCatalog.ID;
                    return saveBuyer(vm.buyer);
                })
                .catch(function(ex) {
                    if (ex.status === 409) {
                        vm.form.NewCatalogID.$setValidity('UnavailableID', false);
                        vm.form.NewCatalogID.$$element[0].focus();
                    } else {
                        $exceptionHandler(ex);
                    }
                });
        }

        function saveBuyer(buyerModel) {
            return OrderCloudSDK.Buyers.Create(buyerModel)
                .then(function(data) {
                    $uibModalInstance.close(data);
                })
                .catch(function(ex) {
                    if (!vm.UseExistingCatalog) OrderCloudSDK.Catalogs.Delete(vm.buyer.DefaultCatalogID);
                    if (ex.status === 409) {
                        vm.form.ID.$setValidity('UnavailableID', false);
                        vm.form.ID.$$element[0].focus();
                    } else {
                        $exceptionHandler(ex);
                    }
                });
        }
        
    }

    function cancel() {
        $uibModalInstance.dismiss();
    }

    function searchCatalogs(term) {
        var options = {
            search: term,
            page:1,
            pageSize:8
        };
        return OrderCloudSDK.Catalogs.List(options)
            .then(function(data) {
                return data.Items;
            });
    }
}