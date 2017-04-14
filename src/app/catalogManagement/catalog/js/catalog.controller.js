angular.module('orderCloud')
    .controller('CatalogCtrl', CatalogController)
;

function CatalogController($exceptionHandler, $state, toastr, SelectedCatalog, OrderCloudSDK, ocCatalogs) {
    var vm = this;
    vm.selectedCatalog = SelectedCatalog;
    vm.model = angular.copy(SelectedCatalog);

    vm.updateValidity = updateValidity;
    vm.updateCatalog = updateCatalog;
    vm.deleteCatalog = deleteCatalog;

    vm.navigationItems = [{
            icon: 'fa-sitemap',
            state: 'catalog',
            name: 'Catalog'
        },
        {
            icon: 'fa-th-large',
            state: 'categories',
            name: 'Categories',
            activeWhen: ['categories', 'categories.category', 'categories.category.products']
        },
        {
            icon: 'fa-tags',
            state: 'catalog.buyers',
            name: 'Buyers'
        }
    ];

    function updateValidity() {
        if (vm.editForm.ID.$error['UnavailableID']) vm.editForm.ID.$setValidity('UnavailableID', true);
    }

    function updateCatalog() {
        OrderCloudSDK.Catalogs.Update(SelectedCatalog.ID, vm.model)
            .then(function(data) {
                toastr.success(data.Name + ' was updated.');
                if (vm.selectedCatalog.ID !== data.ID) {
                    $state.go('.', {catalogid:data.ID});
                } else {
                    vm.selectedCatalog = angular.copy(data);
                    SelectedCatalog = data;
                }
            })
            .catch(function(ex) {
                if (ex.status === 409) {
                    vm.editForm.ID.$setValidity('UnavailableID', false);
                    vm.editForm.ID.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    }

    function deleteCatalog() {
        ocCatalogs.Delete(SelectedCatalog)
            .then(function() {
                toastr.success(SelectedCatalog.Name + ' was deleted.');
                $state.go('catalogs', {}, {reload:'catalogs'});
            });
    }
}