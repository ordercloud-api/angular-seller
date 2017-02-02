angular.module('orderCloud')
    .controller('UsersCtrl', UsersController)
;

function UsersController($exceptionHandler, $state, $stateParams, toastr, $ocMedia, OrderCloud, ocUsers, OrderCloudParameters, UserList, Parameters) {
    var vm = this;
    vm.list = UserList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

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

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.editUser = function(scope) {
        ocUsers.Edit(scope.user, $stateParams.buyerid)
            .then(function(updatedUser) {
                vm.list.Items[scope.$index] = updatedUser;
                toastr.success(updatedUser.Username + ' was updated.', 'Success!');
            })
    };

    vm.createUser = function() {
        ocUsers.Create($stateParams.buyerid)
            .then(function(newUser) {
                vm.list.Items.push(newUser);
                vm.list.Meta.TotalCount++;
                vm.list.Meta.ItemRange[1]++;
                toastr.success(newUser.Username + ' was created.', 'Success!');
            })
    };

    vm.deleteUser = function(scope) {
        ocUsers.Delete(scope.user, $stateParams.buyerid)
            .then(function() {
                toastr.success(scope.user.Username + ' was deleted.', 'Success!');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}