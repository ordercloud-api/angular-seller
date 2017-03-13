angular.module('orderCloud')
    .controller('PromotionsCtrl', PromotionsController)
;

function PromotionsController($exceptionHandler, $state, $stateParams, toastr, OrderCloud, ocParameters, ocPromotions, CurrentAssignments, PromotionList, Parameters) {
    var vm = this;
    vm.list = PromotionList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
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
        return OrderCloud.Promotions.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
            .then(function(data) {
                var mappedData = ocPromotions.Assignments.Map(CurrentAssignments, data, $stateParams.buyerid);
                vm.list.Items = vm.list.Items.concat(mappedData.Items);
                vm.list.Meta = mappedData.Meta;

                selectedCheck();
            });
    };

    function selectedCheck() {
        vm.allItemsSelected = (_.where(vm.list.Items, {Assigned:true}).length == vm.list.Items.length);
    }

    function changedCheck() {
        vm.changedAssignments = ocPromotions.Assignments.Compare(CurrentAssignments, vm.list, $stateParams.usergroupid, $stateParams.buyerid);
    }

    selectedCheck();

    vm.selectAllItems = function() {
        vm.allItemsSelected = !vm.allItemsSelected;
        _.map(vm.list.Items, function(i) { i.Assigned = vm.allItemsSelected });

        changedCheck();
    };

    vm.selectItem = function(scope) {
        if (!scope.promotion.Assigned) vm.allItemsSelected = false;
        vm.selectedCount = _.where(vm.list.Items, {Assigned:true}).length;

        changedCheck();
    };

    vm.resetAssignments = function() {
        vm.list = ocPromotions.Assignments.Map(CurrentAssignments, vm.list, $stateParams.buyerid);
        vm.changedAssignments = [];

        selectedCheck();
    };

    vm.updateAssignments = function() {
        vm.searchLoading = ocPromotions.Assignments.Update(CurrentAssignments, vm.changedAssignments)
            .then(function(data) {
                angular.forEach(data.Errors, function(ex) {
                    $exceptionHandler(ex);
                });
                CurrentAssignments = data.UpdatedAssignments;

                changedCheck();
                selectedCheck();

                toastr.success('Promotion assignments updated.');
            })
    };

    vm.createPromotion = function() {
        ocPromotions.Create($stateParams.buyerid)
            .then(function(newPromotion) {
                if ($stateParams.usergroupid) {
                    var newAssignment = {
                        BuyerID: $stateParams.buyerid,
                        PromotionID: newPromotion.ID,
                        UserGroupID: $stateParams.usergroupid
                    };

                    //Automatically assign the new user to this user group
                    vm.searchLoading = OrderCloud.Promotions.SaveAssignment(newAssignment)
                        .then(function() {
                            newPromotion.Assigned = true;
                            CurrentAssignments.push(newAssignment);
                            _updateList(newPromotion);
                        })
                        .catch(function() {
                            newPromotion.Assigned = false;
                            _updateList(newPromotion);
                        });
                } else {
                    newPromotion.Assigned = false;
                    _updateList(newPromotion);
                }
            });

        function _updateList(n) {
            vm.list.Items.push(n);
            vm.list.Meta.TotalCount++;
            vm.list.Meta.ItemRange[1]++;
            toastr.success(n.Code + ' was created.');
        }
    };

    vm.editPromotion = function(scope) {
        ocPromotions.Edit(scope.promotion, $stateParams.buyerid)
            .then(function(updatedPromotion) {
                updatedPromotion.Assigned = vm.list.Items[scope.$index].Assigned;
                vm.list.Items[scope.$index] = updatedPromotion;
                if (updatedPromotion.ID != scope.promotion.ID) {
                    _.map(CurrentAssignments, function(assignment) {
                        if (assignment.PromotionID == scope.promotion.ID) assignment.PromotionID = updatedPromotion.ID;
                        return assignment;
                    });

                    changedCheck();
                }
                toastr.success(updatedPromotion.Code + ' was updated.');
            })
    };

    vm.deletePromotion = function(scope) {
        ocPromotions.Delete(scope.promotion, $stateParams.buyerid)
            .then(function() {
                toastr.success(scope.promotion.Code + ' was deleted.');
                vm.list.Items.splice(scope.$index, 1);
                vm.list.Meta.TotalCount--;
                vm.list.Meta.ItemRange[1]--;

                changedCheck();
            })
    };
}