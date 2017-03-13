angular.module('orderCloud')
    .controller('AdminUsersCtrl', AdminUsersController)
;

function AdminUsersController($state, toastr, OrderCloud, ocAdminUsers, ocParameters, AdminUsersList, Parameters) {
    var vm = this;
    vm.list = AdminUsersList;
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
        return OrderCloud.AdminUsers.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.createUser = function() {
        ocAdminUsers.Create()
            .then(function(newAdminUser) {
                vm.list.Items.push(newAdminUser);
                vm.list.Meta.TotalCount++;
                vm.list.Meta.ItemRange[1]++;
                toastr.success(newAdminUser.Username + ' was created.');
            })
    };

    vm.editUser = function(scope) {
        ocAdminUsers.Edit(scope.user)
            .then(function(updatedAdminUser) {
                vm.list.Items[scope.$index] = updatedAdminUser;
                toastr.success(updatedAdminUser.Username + ' was updated.');
            })
    };

    vm.deleteUser = function(scope) {
        ocAdminUsers.Delete(scope.user)
            .then(function() {
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
                toastr.success(scope.user.Username + ' was deleted.');
            })
    }
}
