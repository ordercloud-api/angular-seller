angular.module('orderCloud')
    .config(CreateCatalogConfig)
    .controller('CreateCatalogCtrl', CreateCatalogController);

function CreateCatalogConfig($stateProvider) {
    $stateProvider
        .state('catalogs.create', {
            url: '/create',
            templateUrl: 'catalogs/create/templates/create.html',
            controller: 'CreateCatalogCtrl',
            controllerAs: 'createCatalog'
        });
}

function CreateCatalogController(OrderCloud, $state, $exceptionHandler, toastr) {
    var vm = this;
    vm.catalog = {};
    vm.catalog.Active = true;
    vm.catalogCreated = false;

    //functions
    vm.saveCatalog = saveCatalog;

    function saveCatalog() {
        if (vm.catalogCreated) {
            OrderCloud.Catalogs.Update(vm.catalog.ID, vm.catalog)
                .then(function() {
                    toastr.success('Catalog Saved', 'Success');
                    $state.go('catalogs', {catalogid: vm.catalog.ID}, {reload: true});
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        } else {
            OrderCloud.Catalogs.Create(vm.catalog)
                .then(function(data) {
                    vm.catalog.ID = data.ID;
                    vm.catalogCreated = true;
                    toastr.success('Catalog Created', 'Success');
                    $state.go('catalogs', {catalogid: vm.catalog.ID}, {reload: true});
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }

}