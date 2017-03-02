angular.module('orderCloud')
    .controller('CatalogManagementAvailabilityCtrl', CatalogManagementAvailabilityController)
;

function CatalogManagementAvailabilityController($state, $stateParams, toastr, OrderCloud, ocParameters, ocCatalogManagement, Parameters, CurrentAssignments, UserGroupList, CatalogID) {
    var vm = this;
    vm.list = UserGroupList;
    vm.assignmentType = CurrentAssignments.Type;
    //Set parameters
    vm.parameters = Parameters;
    //Sort by is a filter on mobile devices
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    vm.toggleAssignmentType = function(category, buyer) {
        ocCatalogManagement.Availability.ToggleAssignment(vm.assignmentType, category, buyer, CurrentAssignments, CatalogID)
            .then(function(count) {
                if (vm.assignmentType == 'buyer') {
                    toastr.success(category.Name + ' assigned to ' + buyer.Name);
                }
                else if (vm.assignmentType == 'none') {
                    _.map(vm.list.Items, function(i) { i.Assigned = false });
                    vm.changedAssignments = [];
                    CurrentAssignments.Items = [];
                    toastr.success('Assignment' + (count > 1 ? 's' : '') + ' removed for ' + category.Name);
                }
            });
    };

    vm.filter = function(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    };

    vm.search = function() {
        $state.go('.', ocParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.UserGroups.List(vm.parameters.search, 1, vm.parameters.pageSize, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters, Parameters.buyerid)
            .then(function(data) {
                vm.changedAssignments = [];
                vm.list = ocCatalogManagement.Availability.MapAssignments(CurrentAssignments.Items, data);
                vm.searchResults = vm.parameters.search.length > 0;

                selectedCheck();
            });
    };

    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

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

    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    vm.loadMore = function() {
        vm.searchLoading = OrderCloud.UserGroups.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
            .then(function(data) {
                var mappedData = ocCatalogManagement.Availability.MapAssignments(CurrentAssignments.Items, data);
                vm.list.Items = vm.list.Items.concat(mappedData.Items);
                vm.list.Meta = mappedData.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.where(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocCatalogManagement.Availability.CompareAssignments(CurrentAssignments.Items, vm.list, $stateParams.categoryid, $stateParams.buyerid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.userGroup.Assigned) vm.allItemsSelected = false;
        vm.selectedCount = _.where(vm.list.Items, {Assigned:true}).length;

        changedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocCatalogManagement.Availability.MapAssignments(CurrentAssignments.Items, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocCatalogManagement.Availability.UpdateAssignments(CurrentAssignments.Items, vm.changedAssignments, $stateParams.categoryid, CatalogID, $stateParams.buyerid)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments.Items = data.UpdatedAssignments;
                if (!CurrentAssignments.Items.length) {
                    vm.assignmentType = 'none';
                }

                changedCheck();
                selectedCheck();

                toastr.success('Category assignments updated.');
            });
    };
}