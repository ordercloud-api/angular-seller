angular.module('orderCloud')
    .controller('BuyerCatalogsCtrl', BuyerCatalogsController)
;

function BuyerCatalogsController($exceptionHandler, $state, $stateParams, toastr, ocCatalog, OrderCloudSDK, ocParameters, Parameters, CatalogList, SelectedBuyer) {
    var vm = this;
        var vm = this;
    vm.list = CatalogList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
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

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        var parameters = angular.extend(Parameters, {page:vm.list.Meta.Page + 1});
        return OrderCloudSDK.Catalogs.List(parameters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.updateAssignment = function(catalog, type) {
        vm.searchLoading = ocCatalog.Assignments.UpdateAssignment(catalog.ID, $stateParams.buyerid, catalog)
            .then(function(assignment) {
                toastr.success('View all ' + type + ((type == 'categories' ? assignment.viewAllCategories : assignment.viewAllProducts) ? ' enabled' : ' disabled') + ' for catalog ' + catalog.Name);
            });
    };
}