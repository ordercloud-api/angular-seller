angular.module('orderCloud')
    .controller('ApprovalRulesCtrl', ApprovalRulesController)
;

function ApprovalRulesController($state, $stateParams, toastr, $ocMedia, OrderCloud, ocApprovalRules, ocParameters, ApprovalRuleList, Parameters) {
    var vm = this;
    vm.list = ApprovalRuleList;
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

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
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

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.ApprovalRules.List(null, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.editApprovalRule = function(scope) {
        ocApprovalRules.Edit(scope.approvalRule, $stateParams.buyerid)
            .then(function(updatedApprovalRule) {
                vm.list.Items[scope.$index] = updatedApprovalRule;
                toastr.success(updatedApprovalRule.Name + ' was updated.');
            })
    };

    vm.createApprovalRule = function() {
        ocApprovalRules.Create($stateParams.buyerid)
            .then(function(newApprovalRule) {
                vm.list.Items.push(newApprovalRule);
                vm.list.Meta.TotalCount++;
                vm.list.Meta.ItemRange[1]++;
                toastr.success(newApprovalRule.Name + ' was created.');
            })
    };

    vm.deleteApprovalRule = function(scope) {
        ocApprovalRules.Delete(scope.approvalRule, $stateParams.buyerid)
            .then(function() {
                toastr.success(scope.approvalRule.Name + ' was deleted.');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;
            })
    };
}