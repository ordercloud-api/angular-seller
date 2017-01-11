angular.module('orderCloud')
    .config(BuyerConfig)
    .controller('BuyerCtrl', BuyerController);

function BuyerConfig($stateProvider) {
    $stateProvider
        .state('buyers', {
            parent: 'base',
            templateUrl: 'buyers/templates/buyers.tpl.html',
            controller: 'BuyerCtrl',
            controllerAs: 'buyers',
            url: '/buyers?search&page&pageSize',
            resolve : {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloud, Parameters) {
                    return OrderCloud.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize || 12/*, Parameters.searchOn, Parameters.sortBy, Parameters.filters*/);
                    //Commenting out params that don't exist yet in the API
                }
            }
        })


}

function BuyerController($state, $ocMedia, OrderCloud, OrderCloudParameters, Parameters, BuyerList) {
    var vm = this;
    vm.list = BuyerList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.Buyers.List(vm.parameters.search, 1, vm.parameters.pageSize || 12)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.searchResults = false;
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
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

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
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
}



