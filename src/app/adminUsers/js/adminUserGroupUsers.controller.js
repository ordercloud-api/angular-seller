angular.module('orderCloud')
    .controller('AdminUserGroupUsersCtrl', AdminUserGroupUsersController)
;

function AdminUserGroupUsersController($exceptionHandler, $filter, $state, $stateParams, toastr, ocAdminUsers, OrderCloud, ocParameters, ocRolesService, UserList, CurrentAssignments, Parameters ) {
    var vm = this;
    vm.list = UserList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('adminUserGroup.users', ocParameters.Create(vm.parameters, resetPage));
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
                var mappedData = ocAdminUsers.Assignments.Map(CurrentAssignments, data);
                vm.list.Items = vm.list.Items.concat(mappedData.Items);
                vm.list.Meta = mappedData.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.where(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocAdminUsers.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.adminusergroupid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.user.Assigned) vm.allItemsSelected = false;

        changedCheck();
        selectedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocAdminUsers.Assignments.Map(CurrentAssignments, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocAdminUsers.Assignments.Update(CurrentAssignments, vm.changedAssignments)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;

                changedCheck();
                selectedCheck();
            })
    };

    vm.createUser = function() {
        ocAdminUsers.Create()
            .then(function(newAdminUser) {
                if (ocRolesService.UserIsAuthorized(['AdminUserGroupAdmin'])) {
                    var newAssignment = {
                        UserID: newAdminUser.ID,
                        UserGroupID: $stateParams.adminusergroupid
                    };

                    //Automatically assign the new user to this user group
                    vm.searchLoading = OrderCloud.AdminUserGroups.SaveUserAssignment(newAssignment)
                        .then(function() {
                            newAdminUser.Assigned = true;
                            CurrentAssignments.push(newAssignment);
                            _updateList(newAdminUser);
                        })
                        .catch(function() {
                            newAdminUser.Assigned = false;
                            _updateList(newAdminUser);
                        });
                }
                else {
                    newAdminUser.Assigned = false;
                    _updateList(newAdminUser);
                }
            });

        function _updateList(n) {
            vm.list.Items.push(n);
            vm.list.Meta.TotalCount++;
            vm.list.Meta.ItemRange[1]++;
            toastr.success(n.Username + ' was created.');
        }
    };

    vm.editUser = function(scope) {
        ocAdminUsers.Edit(scope.user)
            .then(function(updatedAdminUser) {
                updatedAdminUser.Assigned = vm.list.Items[scope.$index].Assigned;
                vm.list.Items[scope.$index] = updatedAdminUser;
                if (updatedAdminUser.ID != scope.user.ID) {
                    _.map(CurrentAssignments, function(assignment) {
                        if (assignment.UserID == scope.user.ID) assignment.UserID = updatedAdminUser.ID;
                        return assignment;
                    });

                    changedCheck();
                }
                toastr.success(updatedAdminUser.Username + ' was updated.');
            })
    };

    vm.deleteUser = function(scope) {
        ocAdminUsers.Delete(scope.user)
            .then(function() {
                toastr.success(scope.user.Username + ' was deleted.');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;

                changedCheck();
            })
    };
}