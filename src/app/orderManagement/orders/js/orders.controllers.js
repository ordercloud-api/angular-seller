angular.module('orderCloud')
    .controller('OrdersCtrl', OrdersController)
;

function OrdersController($state, $ocMedia, OrderCloud, ocParameters, ocOrdersService, Parameters, OrderList, BuyerCompanies) {
    var vm = this;
    if (Parameters.fromDate) Parameters.fromDate = new Date(Parameters.fromDate);
    if (Parameters.toDate) Parameters.toDate = new Date(Parameters.toDate);
    delete Parameters.filters.DateSubmitted;
    vm.parameters = Parameters;
    vm.list = OrderList;
    vm.buyerCompanies = BuyerCompanies;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    vm.orderStatuses = [
        {Value: 'Open', Name: 'Open'},
        {Value: 'AwaitingApproval', Name: 'Awaiting Approval'},
        {Value: 'Completed', Name: 'Completed'},
        {Value: 'Declined', Name: 'Declined'}
    ];

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    };

    vm.toggleFilters = function() {
        vm.showFilters = !vm.showFilters;
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
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
        vm.parameters.page = vm.list.Meta.Page + 1;
        vm.parameters.pageSize = vm.list.Meta.PageSize;
        return ocOrdersService.List(vm.parameters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.searchBuyerCompanies = function(search) {
        return OrderCloud.Buyers.List(search, 1, 100)
            .then(function(data){
                vm.buyerCompanies = data;
            });
    };
}