angular.module('orderCloud')
    .controller('AddressesCtrl', AddressesController)
;

function AddressesController($exceptionHandler, $state, $stateParams, $ocMedia, toastr, OrderCloud, ocParameters, ocAddresses, CurrentAssignments, AddressList, Parameters){
    var vm = this;
    vm.list = AddressList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    vm.changedAssignments = [];
    vm.userGroupID = $stateParams.usergroupid;

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

    //Clear the search parameters, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        $ocMedia('max-width: 767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameters & reload the state
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
        return OrderCloud.Addresses.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.filters)
            .then(function(data) {
                var mappedData = ocAddresses.Assignments.Map(CurrentAssignments, data);
                vm.list.Items = vm.list.Items.concat(mappedData.Items);
                vm.list.Meta = mappedData.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allShippingSelected = (_.where(vm.list.Items, {shipping:true}).length == vm.list.Items.length);
        vm.allBillingSelected = (_.where(vm.list.Items, {billing:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocAddresses.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.usergroupid);
    }

    selectedCheck();

    vm.selectAllItems = function(type) {
        switch(type) {
            case 'shipping':
                vm.allShippingSelected = !vm.allShippingSelected;
                _.map(vm.list.Items, function(a) { a.shipping = vm.allShippingSelected });
                //select for shipping
                break;
            case 'billing':
                vm.allBillingSelected = !vm.allBillingSelected;
                _.map(vm.list.Items, function(a) { a.billing = vm.allBillingSelected });
                //select for billing
                break;
            default:
                break;
        }

        changedCheck();
    };

    vm.selectItem = function(scope, type) {
        switch(type) {
            case 'shipping':
                if (!scope.address.shipping) vm.allShippingSelected = false;
                //select for shipping
                break;
            case 'billing':
                if (!scope.address.billing) vm.allBillingSelected = false;
                //select for billing
                break;
            default:
                break;
        }

        changedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocAddresses.Assignments.Map(CurrentAssignments, vm.list);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocAddresses.Assignments.Update(CurrentAssignments, vm.changedAssignments, $stateParams.buyerid)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;

                changedCheck();
                selectedCheck();

                toastr.success('Address assignments updated.')
            })
    };

    vm.createAddress = function() {
        ocAddresses.Create($stateParams.buyerid)
            .then(function(newAddress) {
                vm.list.Items.push(newAddress);
                vm.list.Meta.TotalCount++;
                vm.list.Meta.ItemRange[1]++;
                toastr.success(newAddress.AddressName + ' was created.');
            });
    };

    vm.editAddress = function(scope) {
        ocAddresses.Edit(scope.address, $stateParams.buyerid)
            .then(function(updatedAddress) {
                updatedAddress.shipping = vm.list.Items[scope.$index].shipping;
                updatedAddress.billing = vm.list.Items[scope.$index].billing;
                updatedAddress.userGroupID = vm.list.Items[scope.$index].userGroupID;
                vm.list.Items[scope.$index] = updatedAddress;
                if (updatedAddress.ID != scope.address.ID) {
                    _.map(CurrentAssignments, function(assignment) {
                        if (assignment.AddressID == scope.address.ID) assignment.AddressID = updatedAddress.ID;
                        return assignment;
                    });
                    vm.changedAssignments = ocAddresses.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.usergroupid);
                }
                toastr.success(updatedAddress.AddressName + ' was updated.');
            })
    };

    vm.deleteAddress = function(scope) {
        ocAddresses.Delete(scope.address, $stateParams.buyerid)
            .then(function() {
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
                toastr.success(scope.address.AddressName + ' was deleted.');
                vm.changedAssignments = ocAddresses.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.usergroupid);
            });
    };
}