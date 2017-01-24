angular.module('orderCloud')
    .controller('ProductPricingCtrl', ProductPricingController)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)
    .controller('PriceScheduleEditModalCtrl', PriceScheduleEditModalController)
    .controller('PriceSchedulePriceBreakCtrl', PriceSchedulePriceBreakController)
    .controller('PriceScheduleCreateAssignmentCtrl', PriceScheduleCreateAssignmentController)
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
            })
    };

    if ($stateParams.pricescheduleid && vm.listAssignments[$stateParams.pricescheduleid]) {
        vm.selectPrice({assignment:vm.listAssignments[$stateParams.pricescheduleid]});
    } else if (_.keys(vm.listAssignments).length) {
        vm.selectPrice({assignment:vm.listAssignments[_.keys(vm.listAssignments)[0]]});
    }

    vm.editPrice = function() {
        $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceScheduleEdit.modal.html',
            controller: 'PriceScheduleEditModalCtrl',
            controllerAs: 'priceScheduleEditModal',
            resolve: {
                SelectedPriceSchedule: function() {
                    return vm.selectedPrice.PriceSchedule;
                }
            }
        }).result
            .then(function(updatedPriceSchedule) {
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
            })
    };

    vm.deletePrice = function() {
        ocConfirm.Confirm({
            message: 'Are you sure you want to delete this price and all of it\'s assignments? This action cannot be undone.'
            })
            .then(function() {
                console.log('hit');
                vm.loadingPrice = OrderCloud.PriceSchedules.Delete(vm.selectedPrice.PriceSchedule.ID)
                    .then(function() {
                        delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
                        vm.noPricesSet = _.keys(vm.listAssignments).length == 0;
                        vm.selectedPrice = null;
                    })
            })
    };

    //====== Price Breaks =======
    vm.createPriceBreak = function() {
        $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceSchedulePriceBreak.modal.html',
            size: 'md',
            controller: 'PriceSchedulePriceBreakCtrl',
            controllerAs: 'priceBreak',
            resolve: {
                PriceScheduleID: function() {
                    return vm.selectedPrice.PriceSchedule.ID;
                }
            }
        }).result
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

    vm.selectAllPriceBreaks = function(ps) {
        _.each(ps.PriceBreaks, function(pb) { pb.selected = ps.allPriceBreaksSelected });
    };

    vm.selectPriceBreak = function(ps, scope) {
        if (!scope.pricebreak.selected) ps.allPriceBreaksSelected = false;
    };

    vm.removePriceBreaks = function() {
        if (vm.selectedPrice.PriceSchedule.allPriceBreaksSelected || vm.selectedPrice.PriceSchedule.PriceBreaks.length == 1) {
            toastr.error('You must have at least one price break', 'Request Denied');
        } else {
            vm.removePriceBreaksLoading = removePriceBreaks()
                .then(function(updatedPriceSchedule) {
                    var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                    oldAssignment.PriceSchedule = updatedPriceSchedule;
                    oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                    delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                    vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                    vm.selectedPrice = oldAssignment;
                    vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
                })
        }

        function removePriceBreaks() {
            var defer = $q.defer();
            var queue = [];
            _.each(vm.selectedPrice.PriceSchedule.PriceBreaks, function(pb) {{
                if (pb.selected) queue.push(OrderCloud.PriceSchedules.DeletePriceBreak(vm.selectedPrice.PriceSchedule.ID, pb.Quantity));
            }});
            $q.all(queue)
                .then(function() {
                    OrderCloud.PriceSchedules.Get(vm.selectedPrice.PriceSchedule.ID)
                        .then(function(data) {
                            defer.resolve(data);
                        })
                })
                .catch(function(ex) {
                    defer.reject();
                });
            return defer.promise;
        }
    };

    //====== Availability =======
    vm.createAssignment = function(scope) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceScheduleAssignment.modal.html',
            size: 'md',
            controller: 'PriceScheduleCreateAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function() {
                    return OrderCloud.Buyers.List(null, 1, 100);
                },
                SelectedPrice: function() {
                    return vm.selectedPrice;
                },
                SelectedBuyer: function() {
                    return null;
                },
                BuyerUserGroups: function() {
                    return null;
                },
                AssignedUserGroups: function() {
                    return null;
                }
            }
        });

        modalInstance.result.then(function(assignment) {
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
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceScheduleAssignment.modal.html',
            size: 'md',
            controller: 'PriceScheduleCreateAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function() {
                    return {Items: [scope.buyer]};
                },
                SelectedPrice: function() {
                    return vm.selectedPrice;
                },
                SelectedBuyer: function() {
                    return scope.buyer;
                },
                BuyerUserGroups: function() {
                    return OrderCloud.UserGroups.List(null, 1, 20, null, null, null, scope.buyer.ID);
                },
                AssignedUserGroups: function() {
                    return scope.buyer.UserGroups;
                }
            }
        });

        modalInstance.result.then(function(assignment) {
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

function ProductCreateAssignmentController($state, toastr, OrderCloud, ocProductPricing, SelectedProduct, Buyers, PriceBreak) {
    var vm = this;
    vm.buyers = Buyers;
    vm.product = SelectedProduct;
    vm.selectedBuyer = null;
    vm.priceSchedule = {
        RestrictedQuantity: false,
        PriceBreaks: [],
        MinQuantity: 1,
        OrderType: 'Standard'
    };

    vm.getBuyerUserGroups = getBuyerUserGroups;
    vm.saveAssignment = saveAssignment;
    vm.addPriceBreak = addPriceBreak;
    vm.deletePriceBreak = PriceBreak.DeletePriceBreak;
    vm.assignAtUserGroupLevel = false;

    function addPriceBreak() {
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    }

    function getBuyerUserGroups(){
        vm.selectedUserGroups = null;
        OrderCloud.UserGroups.List(null, 1, 20, null, null, null, vm.selectedBuyer.ID)
            .then(function(data){
                vm.buyerUserGroups = data;
            });
    }

    function saveAssignment() {
        ocProductPricing.CreatePrice(vm.product, vm.priceSchedule, vm.selectedBuyer, vm.selectedUserGroups)
            .then(function(data) {
                toastr.success('Price Created', 'Success');
                $state.go('^.pricing', {pricescheduleid:data.PriceScheduleID});
            })
            .catch(function (ex) {
                toastr.error('An error occurred while trying to save your product assignment', 'Error');
            });
    }
}

function PriceScheduleEditModalController($uibModalInstance, SelectedPriceSchedule, OrderCloud) {
    var vm = this;
    vm.data = angular.copy(SelectedPriceSchedule);

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

function PriceSchedulePriceBreakController($uibModalInstance, OrderCloud, PriceScheduleID) {
    var vm = this;
    vm.priceBreak = {
        Quantity: 1,
        Price: 0
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

function PriceScheduleCreateAssignmentController($uibModalInstance, $stateParams, OrderCloud, ocProductPricing, Buyers, SelectedBuyer, BuyerUserGroups, SelectedPrice, AssignedUserGroups) {
    var vm = this;

    vm.buyers = {Items: []};
    vm.selectedBuyer = SelectedBuyer;
    vm.preSelectedBuyer = SelectedBuyer != null;
    vm.buyerUserGroups = {Items: []};
    vm.assignAtUserGroupLevel = vm.preSelectedBuyer;

    var assignedBuyerIDs = _.pluck(SelectedPrice.Availability, 'ID');
    if (vm.preSelectedBuyer) {
        vm.buyers = Buyers;
    }
    else {
        angular.forEach(Buyers.Items, function(buyer) {
            if (assignedBuyerIDs.indexOf(buyer.ID) == -1) {
                vm.buyers.Items.push(buyer);
            }
        });
    }

    var assignedUserGroupIDs = _.pluck(AssignedUserGroups, 'ID');
    if (BuyerUserGroups) {
        angular.forEach(BuyerUserGroups.Items, function(userGroup) {
            if (assignedUserGroupIDs.indexOf(userGroup.ID) == -1) {
                vm.buyerUserGroups.Items.push(userGroup);
            }
        });
    }

    vm.getBuyerUserGroups = function() {
        console.log(vm.selectedBuyer);
        OrderCloud.UserGroups.List(null, 1, 20, null, null, null, vm.selectedBuyer.ID)
            .then(function(data) {
                vm.buyerUserGroups = data;
            });
    };

    vm.confirm = function() {
        if (vm.selectedBuyer.Assigned && vm.selectedUserGroup) {
            OrderCloud.Products.DeleteAssignment($stateParams.productid, null, null, vm.selectedBuyer.ID)
                .then(function() {
                    saveAssignment();
                })
        } else {
            saveAssignment();
        }

        function saveAssignment() {
            var assignment = {
                ProductID: $stateParams.productid,
                PriceScheduleID: SelectedPrice.PriceSchedule.ID,
                BuyerID: vm.selectedBuyer.ID
            };
            if (vm.selectedUserGroup) assignment.UserGroupID = vm.selectedUserGroup.ID;
            vm.loading = ocProductPricing.CreateAssignment(assignment)
                .then(function(data) {
                    $uibModalInstance.close({Buyer: vm.selectedBuyer, UserGroup: vm.selectedUserGroup, PriceScheduleID:SelectedPrice.PriceSchedule.ID});
                })
                .catch(function(ex) {
                    $uibModalInstance.dismiss();
                });
        }
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}