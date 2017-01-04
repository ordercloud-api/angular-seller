angular.module('orderCloud')
    .config(CostCentersConfig)
    .controller('CostCentersCtrl', CostCentersController)
    .controller('CostCenterEditCtrl', CostCenterEditController)
    .controller('CostCenterCreateCtrl', CostCenterCreateController)
    .controller('CostCenterAssignCtrl', CostCenterAssignController)
;

function CostCentersConfig($stateProvider) {
    $stateProvider
        .state('costCenters', {
            parent: 'base',
            templateUrl: 'costCenters/templates/costCenters.tpl.html',
            controller: 'CostCentersCtrl',
            controllerAs: 'costCenters',
            url: '/costcenters?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Cost Centers'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                CostCentersList: function(OrderCloud, Parameters) {
                    return OrderCloud.CostCenters.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('costCenters.edit', {
            url: '/:costcenterid/edit',
            templateUrl:'costCenters/templates/costCenterEdit.tpl.html',
            controller:'CostCenterEditCtrl',
            controllerAs: 'costCenterEdit',
            resolve: {
                SelectedCostCenter: function($stateParams, $state, OrderCloud) {
                    return OrderCloud.CostCenters.Get($stateParams.costcenterid)
                        .catch(function() {
                            $state.go('^.costCenters');
                        });
                }
            }
        })
        .state('costCenters.create', {
            url: '/create',
            templateUrl: 'costCenters/templates/costCenterCreate.tpl.html',
            controller: 'CostCenterCreateCtrl',
            controllerAs: 'costCenterCreate'
        })
        .state('costCenters.assign', {
            url: '/:costcenterid/assign',
            templateUrl: 'costCenters/templates/costCenterAssign.tpl.html',
            controller: 'CostCenterAssignCtrl',
            controllerAs: 'costCenterAssign',
            resolve: {
                Buyer: function(OrderCloud) {
                    return OrderCloud.Buyers.Get();
                },
                UserGroupList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List(null, 1, 20);
                },
                AssignedUserGroups: function($stateParams, OrderCloud) {
                    return OrderCloud.CostCenters.ListAssignments($stateParams.costcenterid);
                },
                SelectedCostCenter: function($stateParams, $state, OrderCloud) {
                    return OrderCloud.CostCenters.Get($stateParams.costcenterid).catch(function() {
                        $state.go('^');
                    });
                }
            }
        })
    ;
}

function CostCentersController($ocMedia, $state, OrderCloud, OrderCloudParameters, CostCentersList, Parameters) {
    var vm = this;
    vm.list = CostCentersList;
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
        return OrderCloud.CreditCards.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize ||  vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function CostCenterEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedCostCenter) {
    var vm = this,
        costCenterid = SelectedCostCenter.ID;
    vm.costCenterName = SelectedCostCenter.Name;
    vm.costCenter = SelectedCostCenter;

    vm.Submit = function() {
        OrderCloud.CostCenters.Update(costCenterid, vm.costCenter)
            .then(function() {
                $state.go('costCenters', {}, {reload: true});
                toastr.success('Cost Center Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.Delete = function() {
        OrderCloud.CostCenters.Delete(SelectedCostCenter.ID)
            .then(function() {
                $state.go('costCenters', {}, {reload: true});
                toastr.success('Cost Center Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CostCenterCreateController($exceptionHandler, $state, toastr, OrderCloud) {
    var vm = this;
    vm.costCenter = {};

    vm.Submit = function() {
        OrderCloud.CostCenters.Create(vm.costCenter)
            .then(function() {
                $state.go('costCenters', {}, {reload: true});
                toastr.success('Cost Center Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CostCenterAssignController($scope, toastr, OrderCloud, Assignments, Paging, UserGroupList, AssignedUserGroups, SelectedCostCenter) {
    var vm = this;
    vm.CostCenter = SelectedCostCenter;
    vm.list = UserGroupList;
    vm.assignments = AssignedUserGroups;
    vm.saveAssignments = SaveAssignment;
    vm.pagingfunction = PagingFunction;

    function SaveFunc(ItemID) {
        return OrderCloud.CostCenters.SaveAssignment({
            UserID: null,
            UserGroupID: ItemID,
            CostCenterID: vm.CostCenter.ID
        });
    }

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserGroupID')
    });

    function DeleteFunc(ItemID) {
        return OrderCloud.CostCenters.DeleteAssignment(vm.CostCenter.ID, null, ItemID);
    }

    function SaveAssignment() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc);
    }

    function AssignmentFunc() {
        return OrderCloud.CostCenters.ListAssignments(vm.CostCenter.ID, null, vm.assignments.Meta.PageSize);
    }

    function PagingFunction() {
        return Paging.Paging(vm.list, 'UserGroups', vm.assignments, AssignmentFunc);
    }
}
