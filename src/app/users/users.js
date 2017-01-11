angular.module('orderCloud')
    .config(UsersConfig)
    .controller('UsersCtrl', UsersController)
;

function UsersConfig($stateProvider) {
    $stateProvider
        .state('users', {
            parent: 'buyersDetails',
            templateUrl: 'users/templates/users.tpl.html',
            controller: 'UsersCtrl',
            controllerAs: 'users',
            url: '/users?userGroupID&search&page&pageSize&searchOn&sortBy&filters',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserList: function(OrderCloud, Parameters) {
                    return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid);
                }
            }
        })
    ;
}

function UsersController($state, $uibModal, toastr,$ocMedia, OrderCloud, OrderCloudParameters, UserList, Parameters) {
    var vm = this;
    vm.list = UserList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
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
        vm.searchLoading = OrderCloud.Users.List(vm.parameters.userGroupID, vm.parameters.search, 1, vm.parameters.pageSize || 12, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters, vm.parameters.buyerid)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
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
        return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.editUser = function(scope) {
        $uibModal.open({
            templateUrl: 'users/editUser/templates/editUser.html',
            controller: 'UserEditCtrl',
            controllerAs: 'userEdit',
            scope: scope,
            bindToController: true
        }).result
            .then(function(data) {
                if (data.update) vm.list.Items[scope.$index] = data.update;
                toastr.success(data.update.Username + ' was updated.', 'Success!');
            })
    };

    vm.createUser = function() {
        $uibModal.open({
            templateUrl: 'users/createUser/templates/createUser.html',
            controller: 'UserCreateCtrl',
            controllerAs: 'userCreate',
            bindToController: true
        }).result
            .then(function(data) {
                if (data.update) vm.list.Items.unshift(data.update);
                toastr.success(data.update.Username + ' was updated.', 'Success!');
            })
    }
}