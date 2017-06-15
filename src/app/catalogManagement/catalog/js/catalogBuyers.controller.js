angular.module('orderCloud')
    .controller('CatalogBuyersCtrl', CatalogBuyersController)
;

function CatalogBuyersController($exceptionHandler, $state, $stateParams, toastr, ocCatalog, OrderCloudSDK, SelectedCatalog, ocParameters, Parameters, BuyerList, CurrentAssignments) {
    var vm = this;
    vm.list = BuyerList;
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
        var parameters = angular.extend(Parameters, {page:vm.list.Meta.Page + 1});
        return OrderCloudSDK.Buyers.List(parameters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.filter(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocCatalog.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.catalogid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected; });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.buyer.Assigned) vm.allItemsSelected = false;
        vm.selectedCount = _.filter(vm.list.Items, {Assigned:true}).length;

        changedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocCatalog.Assignments.Map(CurrentAssignments, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocCatalog.Assignments.Update(CurrentAssignments, vm.changedAssignments, $stateParams.catalogid)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;

                changedCheck();
                selectedCheck();

                toastr.success('Catalog assignments updated.');
            });
    };

    vm.updateAssignment = function(buyer, type) {
        vm.searchLoading = ocCatalog.Assignments.UpdateAssignment($stateParams.catalogid, buyer.ID, buyer)
            .then(function(updatedAssignment) {
                angular.forEach(CurrentAssignments, function(assignment) {
                    if (assignment.BuyerID == updatedAssignment.BuyerID) {
                        assignment = updatedAssignment;
                    }
                });
                
                toastr.success('View all ' + type + ((type == 'categories' ? updatedAssignment.viewAllCategories : updatedAssignment.viewAllProducts) ? ' enabled' : ' disabled') + ' for ' + buyer.Name);
            });
    };
}