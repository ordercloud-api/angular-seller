angular.module('orderCloud')
    .controller('ProductPricingCtrl', ProductPricingController)
    .controller('PriceScheduleEditModalCtrl', PriceScheduleEditModalController)
    .controller('PriceSchedulePriceBreakCreateCtrl', PriceSchedulePriceBreakCreateController)
    .controller('PriceSchedulePriceBreakEditCtrl', PriceSchedulePriceBreakEditController)
;

function ProductPricingController($q, $stateParams, $uibModal, toastr, AssignmentList, AssignmentData, ocProductPricing, ocConfirm, OrderCloud) {
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;

    vm.noPricesSet = _.keys(vm.listAssignments).length == 0;

    vm.selectPrice = function(scope) {
        vm.loadingPrice = ocProductPricing.AssignmentDataDetail(vm.listAssignments, scope.assignment.PriceSchedule.ID)
            .then(function(data) {
                vm.selectedPrice = scope.assignment;
                vm.selectedPrice.PriceSchedule = data.PriceSchedule;
                vm.selectedPrice.Availability = data.Buyers;
            });
    };

    if ($stateParams.pricescheduleid && vm.listAssignments[$stateParams.pricescheduleid]) {
        vm.selectPrice({assignment:vm.listAssignments[$stateParams.pricescheduleid]});
    } else if (_.keys(vm.listAssignments).length) {
        vm.selectPrice({assignment:vm.listAssignments[_.keys(vm.listAssignments)[0]]});
    }

    vm.editPrice = function() {
        ocProductPricing.EditPrice(vm.selectedPrice.PriceSchedule)
            .then(function(updatedPriceSchedule) {
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
            });
    };

    vm.deletePrice = function() {
        ocProductPricing.DeletePrice(vm.selectedPrice.PriceSchedule)
            .then(function() {
                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
                vm.noPricesSet = _.keys(vm.listAssignments).length == 0;
                toastr.success(vm.selectedPrice.PriceSchedule.Name + ' was deleted');
                vm.selectedPrice = null;
            });
    };

    //====== Price Breaks =======
    vm.createPriceBreak = function() {
        ocProductPricing.PriceBreaks.Create(vm.selectedPrice.PriceSchedule)
            .then(function(updatedPriceSchedule) {
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                ocProductPricing.PriceBreaks.DisplayQuantity(updatedPriceSchedule);
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
                toastr.success('Price Break was created.');
            });
    };

    vm.editPriceBreak = function(scope) {
        ocProductPricing.PriceBreaks.Edit(vm.selectedPrice.PriceSchedule, scope.pricebreak)
            .then(function(updatedPriceSchedule) {
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                ocProductPricing.PriceBreaks.DisplayQuantity(updatedPriceSchedule);
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
                toastr.success('Price Break Quantity ' + scope.pricebreak.displayQuantity + ' was updated.');
            });
    };

    vm.deletePriceBreak = function(scope) {
        ocProductPricing.PriceBreaks.Delete(vm.selectedPrice.PriceSchedule, scope.pricebreak)
            .then(function(updatedPriceSchedule) {
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                ocProductPricing.PriceBreaks.DisplayQuantity(updatedPriceSchedule);
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
                toastr.success('Price Break Quantity ' + scope.pricebreak.Quantity + ' was deleted.');
            });
    };

    //====== Availability =======
    vm.createAssignment = function() {
        ocProductPricing.CreateAssignment(vm.selectedPrice)
            .then(function(assignment) {
                if (assignment.UserGroup) {
                    assignment.Buyer.Assigned = false;
                    assignment.Buyer.UserGroups = [assignment.UserGroup];
                    angular.forEach(vm.listAssignments, function(val, key) {
                        angular.forEach(val.UserGroups, function(group, index) {
                            if (group.UserGroupID == assignment.UserGroup.ID && group.BuyerID == assignment.Buyer.ID) vm.listAssignments[key].UserGroups.splice(index, 1);
                        });
                    });
                    if (vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups && vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups.length) {
                        vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups.push({UserGroupID:assignment.UserGroup.ID, BuyerID:assignment.Buyer.ID});
                    } else {
                        vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups = [{UserGroupID:assignment.UserGroup.ID, BuyerID:assignment.Buyer.ID}]
                    }
                } else {
                    assignment.Buyer.Assigned = true;
                    angular.forEach(vm.listAssignments, function(val, key) {
                        var index = val.Buyers.indexOf(assignment.Buyer.ID);
                        if (index > -1) val.Buyers.splice(index, 1);
                        if (val.Buyers.length == 0 && val.UserGroups.length == 0) {
                            OrderCloud.PriceSchedules.Delete(key)
                                .then(function() {
                                    delete vm.listAssignments[key];
                                    vm.noPricesSet = _.keys(vm.listAssignments).length == 0;
                                })
                        }
                    });
                    vm.listAssignments[assignment.PriceScheduleID].Buyers.push(assignment.Buyer.ID);
                }
                vm.selectedPrice.Availability.push(assignment.Buyer);
            });
    };

    vm.removeBuyerAssignment = function(scope) {
        vm.availabilityLoading = [];
        if (vm.selectedPrice.Availability.length == 1) {
            ocConfirm.Confirm({
                message: "Removing the last buyer organization will remove this price from the product entirely. Do you wish to continue?"
                })
                .then(function() {
                    vm.availabilityLoading[scope.$index] = OrderCloud.PriceSchedules.Delete(vm.selectedPrice.PriceSchedule.ID)
                        .then(function() {
                            delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
                            vm.noPricesSet = _.keys(vm.listAssignments).length == 0;
                            vm.selectedPrice = null;
                        })
                });
        } else if (!scope.buyer.Assigned) {
            //delete all user group assignments
            var queue = [];
            angular.forEach(scope.buyer.UserGroups, function(ug) {
                vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups = _.filter(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups, function(group) {
                    return !((group.UserGroupID == ug.ID) && (group.BuyerID == scope.buyer.ID));
                });
                queue.push(OrderCloud.Products.DeleteAssignment($stateParams.productid, null, ug.ID, scope.buyer.ID));
            });

            vm.availabilityLoading[scope.$index] = $q.all(queue)
                .then(function() {
                    vm.selectedPrice.Availability.splice(scope.$index, 1);
                });

        } else {
            //delete buyer assignment
            vm.availabilityLoading[scope.$index] = OrderCloud.Products.DeleteAssignment($stateParams.productid, null, null, scope.buyer.ID)
                .then(function() {
                    vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers = _.without(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers, scope.buyer.ID);
                    vm.selectedPrice.Availability.splice(scope.$index, 1);
                });
        }
    };

    vm.addUserGroupAssignment = function(scope) {
        ocProductPricing.CreateUserGroupAssignment(scope, vm.selectedPrice)
            .then(function(assignment) {
                if (!scope.buyer.Assigned) {
                    vm.selectedPrice.Availability[scope.$index].UserGroups.push(assignment.UserGroup);
                    angular.forEach(vm.listAssignments, function(val, key) {
                        angular.forEach(val.UserGroups, function(group, index) {
                            if (group.UserGroupID == assignment.UserGroup.ID && assignment.Buyer.ID == group.BuyerID) vm.listAssignments[key].UserGroups.splice(index, 1);
                            if (!vm.listAssignments[key].UserGroups.length && !vm.listAssignments[key].Buyers.length) {
                                OrderCloud.PriceSchedules.Delete(key)
                                    .then(function() {
                                        delete vm.listAssignments[key];
                                        vm.noPricesSet = _.keys(vm.listAssignments).length == 0;
                                    })
                            }
                        });
                    });
                    vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups.push({UserGroupID:assignment.UserGroup.ID, BuyerID:scope.buyer.ID});
                } else {
                    vm.selectedPrice.Availability[scope.$index].Assigned = false;
                    vm.selectedPrice.Availability[scope.$index].UserGroups = [assignment.UserGroup];
                    var existingBuyerIndex = vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers.indexOf(scope.buyer.ID);
                    if (existingBuyerIndex > -1) vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers.splice(existingBuyerIndex, 1);
                    angular.forEach(vm.listAssignments, function(val, key) {
                        angular.forEach(val.UserGroups, function(group, index) {
                            if (group.UserGroupID == assignment.UserGroup.ID) vm.listAssignments[key].UserGroups.splice(index, 1);
                        });
                    });
                    vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups.push({UserGroupID: assignment.UserGroup.ID, BuyerID:scope.buyer.ID});
                }
            });
    };

    vm.selectAllUserGroups = function(scope) {
        _.map(scope.buyer.UserGroups, function(ug) { ug.selected = scope.buyer.allGroupsSelected });
    };

    vm.selectUserGroup = function(buyer, scope) {
        if (!scope.userGroup.selected) buyer.allGroupsSelected = false;
    };

    vm.removeUserGroupAssignments = function(scope) {
        if (scope.buyer.allGroupsSelected || (_.filter(scope.buyer.UserGroups, function(ug){ return ug.selected}).length == scope.buyer.UserGroups.length)) {
            ocConfirm.Confirm({
                message: 'Would you like to assign this price to the buyer <b>' + scope.buyer.Name + '</b>?',
                confirmText: 'Yes',
                cancelText: 'No'
            })
                .then(function() {
                    vm.availabilityLoading = [];
                    var queue = [];
                    queue.push(OrderCloud.Products.SaveAssignment({
                            ProductID: $stateParams.productid,
                            BuyerID: scope.buyer.ID,
                            PriceScheduleID: vm.selectedPrice.PriceSchedule.ID
                        }));
                    angular.forEach(_.filter(scope.buyer.UserGroups, function(ug){ return ug.selected}), function(ug) {
                        queue.push(OrderCloud.Products.DeleteAssignment($stateParams.productid, null, ug.ID, scope.buyer.ID));
                    });
                    vm.availabilityLoading[scope.$index] = $q.all(queue)
                        .then(function() {
                            vm.selectedPrice.Availability[scope.$index].Assigned = true;
                            angular.forEach(vm.listAssignments, function(val, key) {
                                var index = val.Buyers.indexOf(scope.buyer.ID);
                                if (index > -1) val.Buyers.splice(index, 1);
                                if (val.Buyers.length == 0 && val.UserGroups.length == 0) {
                                    OrderCloud.PriceSchedules.Delete(key)
                                        .then(function() {
                                            delete vm.listAssignments[key];
                                            vm.noPricesSet = _.keys(vm.listAssignments).length == 0;
                                        })
                                }
                            });
                            vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers.push(scope.buyer.ID);
                            delete vm.selectedPrice.Availability[scope.$index].UserGroups;
                            vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups = [];
                        });
                })
                .catch(function() {
                    vm.removeBuyerAssignment(scope);
                });
            //TODO: Confirm if they want to assign this at the buyer level, if so, unassign all groups and assign to the buyer - update the VM
        } else {
            vm.availabilityLoading = [];
            var queue = [];
            var listAssignmentUserGroups = vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups;
            var availabilityUserGroups = vm.selectedPrice.Availability[scope.$index].UserGroups;
            angular.forEach(_.filter(scope.buyer.UserGroups, function(ug){ return ug.selected}), function(ug) {
                listAssignmentUserGroups = _.filter(listAssignmentUserGroups, function(group) {
                    return !((group.UserGroupID == ug.ID) && (group.BuyerID == scope.buyer.ID));
                });
                availabilityUserGroups = _.filter(availabilityUserGroups, function(group) {
                    return group.ID != ug.ID;
                });
                queue.push(OrderCloud.Products.DeleteAssignment($stateParams.productid, null, ug.ID, scope.buyer.ID));
            });
            vm.availabilityLoading[scope.$index] = $q.all(queue)
                .then(function() {
                    vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].UserGroups = listAssignmentUserGroups;
                    vm.selectedPrice.Availability[scope.$index].UserGroups = availabilityUserGroups;
                });
        }
    }
}

function PriceScheduleEditModalController($uibModalInstance, SelectedPriceSchedule, OrderCloud) {
    var vm = this;
    vm.data = angular.copy(SelectedPriceSchedule);
    vm.priceScheduleName = SelectedPriceSchedule.Name;

    vm.submit = function() {
        vm.loading = OrderCloud.PriceSchedules.Update(SelectedPriceSchedule.ID, vm.data)
            .then(function(updatedPriceSchdule) {
                $uibModalInstance.close(updatedPriceSchdule);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}

function PriceSchedulePriceBreakCreateController($uibModalInstance, OrderCloud, PriceScheduleID) {
    var vm = this;
    vm.priceBreak = {
        Quantity: 1,
        Price: null
    };

    vm.confirm = function() {
        vm.loading = OrderCloud.PriceSchedules.SavePriceBreak(PriceScheduleID, vm.priceBreak)
            .then(function(priceSchedule) {
                $uibModalInstance.close(priceSchedule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function PriceSchedulePriceBreakEditController($uibModalInstance, OrderCloud, PriceScheduleID, PriceBreak) {
    var vm = this;
    vm.priceBreak = angular.copy(PriceBreak);

    vm.confirm = function() {
        vm.loading = OrderCloud.PriceSchedules.SavePriceBreak(PriceScheduleID, vm.priceBreak)
            .then(function(priceSchedule) {
                $uibModalInstance.close(priceSchedule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}