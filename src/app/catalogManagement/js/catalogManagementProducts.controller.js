angular.module('orderCloud')
    .controller('CatalogManagementProductsCtrl', CatalogManagementProductsController)
;

function CatalogManagementProductsController($state, $stateParams, toastr, OrderCloud, ocCatalogManagement, ocParameters, Parameters, CurrentAssignments, ProductList, CatalogID) {
    var vm = this;
    vm.list = ProductList;
    //Set parameters
    vm.parameters = Parameters;
    //Sort by is a filter on mobile devices
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    vm.filter = function(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    };

    vm.search = function() {
        vm.filter(true);
    };

    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    vm.loadMore = function() {
        return OrderCloud.Products.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                var mappedData = ocCatalogManagement.Products.MapAssignments(CurrentAssignments, data);
                vm.list.Items = vm.list.Items.concat(mappedData.Items);
                vm.list.Meta = mappedData.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.where(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocCatalogManagement.Products.CompareAssignments(CurrentAssignments, vm.list, $stateParams.categoryid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.product.Assigned) vm.allItemsSelected = false;
        vm.selectedCount = _.where(vm.list.Items, {Assigned:true}).length;

        changedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocCatalogManagement.Products.MapAssignments(CurrentAssignments, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocCatalogManagement.Products.UpdateAssignments(CurrentAssignments, vm.changedAssignments, CatalogID)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;

                changedCheck();
                selectedCheck();

                toastr.success('Product assignments updated.');
            });
    };
}