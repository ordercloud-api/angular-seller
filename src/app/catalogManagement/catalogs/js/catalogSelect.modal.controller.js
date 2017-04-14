angular.module('orderCloud')
    .controller('CatalogSelectModalCtrl', CatalogSelectModalController)
;

function CatalogSelectModalController($uibModalInstance, OrderCloudSDK, BuyerList) {
    var vm = this;
    var selectedCatalogID = angular.copy(BuyerList.Items[0].DefaultCatalogID);
    vm.buyers = BuyerList;
    vm.submit = submit;
    vm.searchCatalogs = searchCatalogs;
    vm.cancel = $uibModalInstance.dismiss;
    vm.replacementDefaultCatalog = null;

    function submit() {
        $uibModalInstance.close(vm.replacementDefaultCatalog);
    }

    function searchCatalogs(term) {
        var options = {
            search: term,
            page:1,
            pageSize:8,
            filters: {
                ID: '!' + selectedCatalogID
            }
        };
        return OrderCloudSDK.Catalogs.List(options)
            .then(function(data) {
                return data.Items;
            });
    }
}