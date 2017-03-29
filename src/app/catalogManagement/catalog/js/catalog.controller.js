angular.module('orderCloud')
    .controller('CatalogCtrl', CatalogController)
;

function CatalogController(SelectedCatalog) {
    var vm = this;
    vm.selectedCatalog = SelectedCatalog;
}