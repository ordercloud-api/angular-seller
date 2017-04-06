angular.module('orderCloud')
    .controller('SellerUserGroupsCtrl', SellerUserGroupsController)
;

function SellerUserGroupsController($state, toastr, OrderCloudSDK, ocSellerUserGroups, ocParameters, SellerUserGroupList, Parameters){
    var vm = this;
    vm.list = SellerUserGroupList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //check if search was used:
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //reload the state with new parameters:
    vm.filter = function(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
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

    //reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page: vm.list.Meta.Page});
    };

    //load the next page of results with all the same parameters
    vm.loadMore = function() {
        var parameters = angular.extend(Parameters, {page:vm.list.Meta.Page + 1});
        return OrderCloudSDK.AdminUserGroups.List(parameters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.createGroup = function() {
        ocSellerUserGroups.Create()
            .then(function(newUserGroup) {
                toastr.success(newUserGroup.Name + ' was created.');
                $state.go('sellerUserGroup', {sellerusergroupid:newUserGroup.ID});
            });
    };

    vm.deleteGroup = function(scope) {
        ocSellerUserGroups.Delete(scope.sellerUserGroup)
            .then(function() {
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
                toastr.success(scope.sellerUserGroup.Name + ' was deleted.');
            });
    };
}