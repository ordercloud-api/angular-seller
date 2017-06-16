angular.module('orderCloud')
    .controller('SellerUserGroupUsersCtrl', SellerUserGroupUsersController)
;

function SellerUserGroupUsersController($exceptionHandler, $filter, $state, $stateParams, toastr, ocSellerUsers, OrderCloudSDK, ocParameters, ocRoles, UserList, SelectedSellerUserGroup, CurrentAssignments, Parameters ) {
    var vm = this;
    vm.list = UserList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('sellerUserGroup.users', ocParameters.Create(vm.parameters, resetPage));
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
        var parameters = angular.extend(Parameters, {page: vm.list.Meta.Page + 1});
        return OrderCloudSDK.AdminUsers.List(parameters)
            .then(function(data) {
                var mappedData = ocSellerUsers.Assignments.Map(CurrentAssignments, data);
                vm.list.Items = vm.list.Items.concat(mappedData.Items);
                vm.list.Meta = mappedData.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.filter(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocSellerUsers.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.sellerusergroupid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected; });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.user.Assigned) vm.allItemsSelected = false;

        changedCheck();
        selectedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocSellerUsers.Assignments.Map(CurrentAssignments, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocSellerUsers.Assignments.Update(CurrentAssignments, vm.changedAssignments)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;
                toastr.success('Seller user assignments updated for ' + SelectedSellerUserGroup.Name + '.');
                changedCheck();
                selectedCheck();
            });
    };

    vm.createUser = function() {
        ocSellerUsers.Create()
            .then(function(newSellerUser) {
                if (ocRoles.UserIsAuthorized(['AdminUserGroupAdmin'])) {
                    var newAssignment = {
                        UserID: newSellerUser.ID,
                        UserGroupID: $stateParams.sellerusergroupid
                    };

                    //Automatically assign the new user to this user group
                    vm.searchLoading = OrderCloudSDK.AdminUserGroups.SaveUserAssignment(newAssignment)
                        .then(function() {
                            newSellerUser.Assigned = true;
                            CurrentAssignments.push(newAssignment);
                            _updateList(newSellerUser);
                        })
                        .catch(function() {
                            newSellerUser.Assigned = false;
                            _updateList(newSellerUser);
                        });
                }
                else {
                    newSellerUser.Assigned = false;
                    _updateList(newSellerUser);
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
        ocSellerUsers.Edit(scope.user)
            .then(function(updatedSellerUser) {
                updatedSellerUser.Assigned = vm.list.Items[scope.$index].Assigned;
                vm.list.Items[scope.$index] = updatedSellerUser;
                if (updatedSellerUser.ID != scope.user.ID) {
                    _.map(CurrentAssignments, function(assignment) {
                        if (assignment.UserID == scope.user.ID) assignment.UserID = updatedSellerUser.ID;
                        return assignment;
                    });

                    changedCheck();
                }
                toastr.success(updatedSellerUser.Username + ' was updated.');
            });
    };

    vm.deleteUser = function(scope) {
        ocSellerUsers.Delete(scope.user)
            .then(function() {
                toastr.success(scope.user.Username + ' was deleted.');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;

                changedCheck();
            });
    };
}