angular.module('orderCloud')
    .controller('BuyersCtrl', BuyersController);

function BuyersController($exceptionHandler, $state, toastr, ocBuyers, OrderCloud, ocParameters, Parameters, BuyerList) {
    var vm = this;
    vm.list = BuyerList;
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
        return OrderCloud.Buyers.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.createBuyer = function() {
        ocBuyers.Create()
            .then(function(data) {
                toastr.success(data.Name + ' was created.');
                $state.go('buyer', {buyerid: data.ID});
            })
    };

    vm.deleteBuyer = function(scope) {
        ocBuyers.Delete(scope.buyer)
            .then(function() {
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
                toastr.success(scope.buyer.Name + ' was deleted.');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            })
    }
}



