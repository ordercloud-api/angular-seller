angular.module('orderCloud')
    .config(BuyerDetailsConfig)
    .controller('BuyerDetailsCtrl', BuyerDetailsController)
;

function BuyerDetailsConfig($stateProvider) {
    $stateProvider
        .state('buyers.details', {
                url: '/:buyerid/details',
                templateUrl: 'buyers/details/templates/details.html',
                controller: 'BuyerDetailsCtrl',
                controllerAs: 'buyerDetails',
                resolve: {
                    Parameters: function($stateParams, OrderCloudParameters) {
                        return OrderCloudParameters.Get($stateParams);
                    },
                    SelectedBuyer: function ($stateParams, OrderCloud) {
                        return OrderCloud.Buyers.Get($stateParams.buyerid);
                    },
                    UserList: function(OrderCloud, Parameters, $stateParams) {
                        return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters, $stateParams.buyerid);
                    },
                    UserGroupList: function(OrderCloud, Parameters, $stateParams) {
                        return OrderCloud.UserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters, $stateParams.buyerid);
                    }
                }
            })
}

function BuyerDetailsController(Parameters, OrderCloudParameters, OrderCloud, $ocMedia, $state, SelectedBuyer, UserList, UserGroupList){
    var vm = this;
    vm.selectedBuyer = SelectedBuyer;
    vm.userList = UserList;
    vm.userGroupList = UserGroupList;
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
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
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
        return OrderCloud.Users.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}