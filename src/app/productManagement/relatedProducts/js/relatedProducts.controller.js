angular.module('orderCloud')
    .controller('RelatedProductsCtrl', RelatedProductsController)
;

function RelatedProductsController(toastr, $state, ocParameters, ProductList, SelectedProduct, ocRelatedProducts, Parameters) {
var vm = this;
    vm.list = ProductList;
    //Set parameters
    vm.parameters = Parameters;
    //Sort by is a filter on mobile devices
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    vm.clearSearch =  clearSearch; //Clear the search parameter, reload the state & reset the page
    vm.filter = filter; //Reload the state with new parameters
    vm.loadMore = loadMore; //Load the next page of results with all of the same parameters
    vm.pageChanged = pageChanged; //Reload the state with the incremented page parameter
    vm.search = search; //Reload the state with new search parameter & reset the page
    vm.updateSort = updateSort; //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.toggle = toggle;

    function toggle(scope) {
        ocRelatedProducts.Toggle(scope.product)
            .then(function(wasAdded) {
                if (wasAdded) {
                    toastr.success(scope.product.Name + ' was added to related products for ' + SelectedProduct.Name);
                } else {
                    toastr.success(scope.product.Name + ' was removed from related products for ' + SelectedProduct.Name);
                }
            });
    }

    function filter(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    }

    function search() {
        vm.filter(true);
    }

    function clearSearch() {
        vm.parameters.search = null;
        vm.filter(true);
    }

    function updateSort(value) {
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
    }

    function pageChanged() {
        $state.go('.', {page:vm.list.Meta.Page});
    }

    function loadMore() {
        var parameters = angular.extend(Parameters, {page:vm.list.Meta.Page + 1});
        return ocRelatedProducts.List(SelectedProduct, parameters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    }
}