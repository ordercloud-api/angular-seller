angular.module('orderCloud')
    .config(UserGroupsConfig)
    .controller('UserGroupsCtrl', UserGroupsController)
    .controller('UserGroupEditCtrl', UserGroupEditController)
    .controller('UserGroupCreateCtrl', UserGroupCreateController)
    .controller('UserGroupAssignCtrl', UserGroupAssignController)
;

function UserGroupsConfig($stateProvider) {
    $stateProvider
        .state('userGroups', {
            parent: 'base',
            templateUrl: 'userGroups/templates/userGroups.tpl.html',
            controller: 'UserGroupsCtrl',
            controllerAs: 'userGroups',
            url: '/usergroups?search&page&pageSize&sortBy&searchOn&filters',
            data: {componentName: 'User Groups'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserGroupList: function(OrderCloud, Parameters) {
                    return OrderCloud.UserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('userGroups.edit', {
            url: '/:usergroupid/edit',
            templateUrl: 'userGroups/templates/userGroupEdit.tpl.html',
            controller: 'UserGroupEditCtrl',
            controllerAs: 'userGroupEdit',
            resolve: {
                SelectedUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.usergroupid);
                }
            }
        })
        .state('userGroups.create', {
            url: '/create',
            params: {
                fromRoute: null,
                buyerid: null
            },
            templateUrl: 'userGroups/templates/userGroupCreate.tpl.html',
            controller: 'UserGroupCreateCtrl',
            controllerAs: 'userGroupCreate',
            resolve: {
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                }
            }
        })
        .state('userGroups.assign', {
            url: '/:usergroupid/assign',
            params: {
                fromRoute: null,
                buyerid: null
            },
            templateUrl: 'userGroups/templates/userGroupAssign.tpl.html',
            controller: 'UserGroupAssignCtrl',
            controllerAs: 'userGroupAssign',
            resolve: {
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserList: function(OrderCloud) {
                    return OrderCloud.Users.List(null, null, 1, 20);
                },
                AssignedUsers: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.ListUserAssignments($stateParams.usergroupid);
                },
                SelectedUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.usergroupid);
                }
            }
        })
    ;
}

function UserGroupsController($state, $ocMedia, OrderCloud, OrderCloudParameters, UserGroupList, Parameters) {
    var vm = this;
    vm.list = UserGroupList;
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
        return OrderCloud.UserGroups.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function UserGroupEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedUserGroup) {
    var vm = this,
        groupID = SelectedUserGroup.ID;
    vm.userGroupName = SelectedUserGroup.Name;
    vm.userGroup = SelectedUserGroup;

    vm.Submit = function() {
        OrderCloud.UserGroups.Update(groupID, vm.userGroup)
            .then(function() {
                $state.go('userGroups', {}, {reload: true});
                toastr.success('User Group Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.UserGroups.Delete(SelectedUserGroup.ID)
            .then(function() {
                $state.go('userGroups', {}, {reload: true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function UserGroupCreateController($exceptionHandler, $state, toastr, OrderCloud, Parameters) {
    var vm = this;

    vm.Submit = function() {
        OrderCloud.UserGroups.Create(vm.userGroup)
            .then(function() {
                if(Parameters.fromRoute == "buyerDetails") {
                    $state.go('buyers.details', {buyerid: Parameters.buyerid}, {reload: true});
                    toastr.success('User Group Created', 'Success');
                } else {
                    $state.go('userGroups', {}, {reload: true});
                    toastr.success('User Group Created', 'Success');
                }
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function UserGroupAssignController($scope, $state, toastr, OrderCloud, Assignments, Paging, Parameters, UserList, AssignedUsers, SelectedUserGroup) {
    var vm = this;
    vm.UserGroup = SelectedUserGroup;
    vm.list = UserList;
    vm.assignments = AssignedUsers;
    vm.saveAssignments = SaveAssignment;
    vm.pagingfunction = PagingFunction;
    vm.cancel = Cancel;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserID');
    });

    function SaveFunc(ItemID) {
        return OrderCloud.UserGroups.SaveUserAssignment({
            UserID: ItemID,
            UserGroupID: vm.UserGroup.ID
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloud.UserGroups.DeleteUserAssignment(vm.UserGroup.ID, ItemID);
    }

    function SaveAssignment() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'UserID');
    }

    function AssignmentFunc() {
        return OrderCloud.UserGroups.ListUserAssignments(vm.UserGroup.ID, null, vm.assignments.Meta.PageSize, 'UserID');
    }

    function PagingFunction() {
        return Paging.Paging(vm.list, 'Users', vm.assignments, AssignmentFunc);
    }

    function Cancel() {
        if(Parameters.fromRoute == "buyerDetails") {
            $state.go('buyers.details', {buyerid: Parameters.buyerid}, {reload: false});
        } else {
            $state.go('userGroups');
        }
    }
}