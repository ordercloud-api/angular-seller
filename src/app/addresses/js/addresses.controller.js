angular.module('orderCloud')
    .controller('AddressesCtrl', AddressesController)
;

function AddressesController($q, $state, $stateParams, $filter, $uibModal, $ocMedia, toastr, ocConfirm, OrderCloud, OrderCloudParameters, AddressList, Parameters){
    var vm = this;
    vm.list = AddressList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort By is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.Addresses.List(vm.parameters.search, 1, vm.parameters.pageSize || 12)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
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
        return OrderCloud.Addresses.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.editAddress = function(scope) {
        $uibModal.open({
            templateUrl: 'addresses/templates/addressEdit.modal.html',
            controller: 'AddressEditModalCtrl',
            controllerAs: 'addressEditModal',
            scope: scope,
            bindToController: true,
            resolve: {
                SelectedBuyerID: function() {
                    return $stateParams.buyerid;
                }
            }
        }).result
            .then(function(updatedAddress) {
                vm.list.Items[scope.$index] = updatedAddress;
                toastr.success(updatedAddress.AddressName + ' was updated.', 'Success!');
            })
    };

    vm.createAddress = function() {
        $uibModal.open({
            templateUrl: 'addresses/templates/addressCreate.modal.html',
            controller: 'AddressCreateModalCtrl',
            controllerAs: 'addressCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return $stateParams.buyerid;
                }
            }
        }).result
            .then(function(newAddress) {
                if (newAddress) vm.list.Items.push(newAddress);
                toastr.success(newAddress.AddressName + ' was created.', 'Success!');
            })
    };

    vm.allItemsSelected = false;
    vm.selectAllItems = function() {
        _.map(vm.list.Items, function(a) { a.selected = vm.allItemsSelected });
        vm.selectedCount = vm.allItemsSelected ? vm.list.Items.length : 0;
    };

    vm.selectItem = function(scope) {
        if (!scope.address.selected) vm.allItemsSelected = false;
        vm.selectedCount = $filter('filter')(vm.list.Items, {'selected':true}).length;
    };

    vm.deleteSelected = function() {
        ocConfirm.Confirm({
            'message': 'Are you sure you want to delete the selected admin addresses? <br> <b>This action cannot be undone.</b>',
            'confirmText': 'Delete ' + vm.selectedCount + (vm.selectedCount == 1 ? ' admin address' : ' admin addresses')
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

                        OrderCloud.Addresses.Delete(item.ID)
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
                    toastr.success(successCount + (successCount == 1 ? ' admin address was deleted' : ' admin addresses were deleted'), 'Success!');
                    vm.selectedCount = 0;
                    vm.allItemsSelected = false;
                    if (!vm.list.Items.length) vm.filter(true);
                    df.resolve();
                });

            return df.promise;
        }
    }

}