angular.module('orderCloud')
    .controller('AdminUserGroupsCtrl', AdminUserGroupsController)
;

function AdminUserGroupsController($q, $filter, $state, $uibModal, toastr, $ocMedia, ocConfirm, OrderCloud, OrderCloudParameters, AdminUserGroupList, Parameters){
    var vm = this;
    vm.list = AdminUserGroupList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;


    //check if filters are applied:
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width: 767px') && vm.sortSelection);
    vm.showFilters = vm.filtersApplied;

    //check if search was used:
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //reload the state with new parameters:
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.AdminUserGroups.List(vm.parameters.search, 1, vm.parameters.pageSize || 12, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters, vm.parameters.buyerid)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
    };

    //clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //clear the relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width: 767px') ? vm.parameters.sortBy = null : angular.noop();
        vm.filter(true);
    };

    //conditionally set, reverse, and remove the sortBy parameters & reload the state
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

    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split("!")[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page: vm.list.Meta.Page});
    };

    //load the next page of results with all the same parameters
    vm.loadMore = function() {
        return OrderCloud.AdminUserGroups.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.createGroup = function() {
        $uibModal.open({
            templateUrl: 'adminUserGroups/templates/adminUserGroupCreate.modal.html',
            controller: 'AdminUserGroupCreateModalCtrl',
            controllerAs: 'adminUserGroupCreateModal'
        }).result
            .then(function(data) {
                toastr.success(data.Name + ' was created.', 'Success!');
                $state.go('adminUserGroup', {adminusergroupid:data.ID});
            })
    };

    vm.allItemsSelected = false;
    vm.selectAllItems = function() {
        _.map(vm.list.Items, function(i) { i.selected = vm.allItemsSelected });
        vm.selectedCount = vm.allItemsSelected ? vm.list.Items.length : 0;
    };

    vm.selectItem = function(scope) {
        if (!scope.adminUserGroup.selected) vm.allItemsSelected = false;
        vm.selectedCount = $filter('filter')(vm.list.Items, {'selected':true}).length;
    };

    vm.deleteSelected = function() {
        ocConfirm.Confirm({
                'message': 'Are you sure you want to delete the selected admin user groups and all of their assignments? <br> <b>This action cannot be undone.</b>',
                'confirmText': 'Delete ' + vm.selectedCount + (vm.selectedCount == 1 ? ' user group' : ' user groups')
            })
            .then(function() {
                return run();
            });

        function run() {
            var df = $q.defer(),
                successCount = 0,
                deleteQueue = [];

            angular.forEach(vm.list.Items, function(item) {
                if (item.selected) {
                    deleteQueue.push((function() {
                        var d = $q.defer();

                        OrderCloud.AdminUserGroups.Delete(item.ID)
                            .then(function() {
                                successCount++;
                                vm.list.Items = _.without(vm.list.Items, item);
                                vm.list.Meta.TotalCount--;
                                vm.list.Meta.ItemRange[1]--;
                                d.resolve();
                            })
                            .catch(function() {
                                d.resolve();
                            });

                        return d.promise;
                    })())
                }
            });

            vm.searchLoading = $q.all(deleteQueue)
                .then(function() {
                    toastr.success(successCount + (successCount == 1 ? ' admin user group was deleted' : ' admin user groups were deleted'), 'Success!');
                    vm.selectedCount = 0;
                    vm.allItemsSelected = false;
                    if (!vm.list.Items.length) vm.filter(true);
                    df.resolve();
                });

            return df.promise;
        }
    }
}