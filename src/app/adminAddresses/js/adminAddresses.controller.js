angular.module('orderCloud')
    .controller('AdminAddressesCtrl', AdminAddressesController)
;

function AdminAddressesController($state, $uibModal, $ocMedia, toastr, OrderCloud, OrderCloudParameters, AddressList, Parameters){
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
        vm.searchLoading = OrderCloud.AdminAddresses.List(vm.parameters.search, 1, vm.parameters.pageSize || 12)
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
        return OrderCloud.AdminAddresses.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.editAddress = function(scope) {
        $uibModal.open({
            templateUrl: 'adminAddresses/templates/adminAddressEdit.modal.html',
            controller: 'AdminAddressEditModalCtrl',
            controllerAs: 'adminAddressEditModal',
            scope: scope,
            bindToController: true
        }).result
            .then(function(updatedAddress) {
                vm.list.Items[scope.$index] = updatedAddress;
                toastr.success(updatedAddress.AddressName + ' was updated.', 'Success!');
            })
    };

    vm.createAddress = function() {
        $uibModal.open({
            templateUrl: 'adminAddresses/templates/adminAddressCreate.modal.html',
            controller: 'AdminAddressCreateModalCtrl',
            controllerAs: 'adminAddressCreateModal'
        }).result
            .then(function(newAddress) {
                if (newAddress) vm.list.Items.push(newAddress);
                toastr.success(newAddress.AddressName + ' was created.', 'Success!');
            })
    }

}