angular.module('orderCloud')
    .controller('ProductPricingCtrl', ProductPricingController)
    .controller('PriceScheduleEditModalCtrl', PriceScheduleEditModalController)
    .controller('PriceScheduleDetailCtrl', PriceScheduleDetailController)
    .controller('PriceSchedulePriceBreakCtrl', PriceSchedulePriceBreakController)
    .controller('PriceScheduleCreateAssignmentCtrl', PriceScheduleCreateAssignmentController)
;

function ProductPricingController($q, $stateParams, $uibModal, toastr, AssignmentList, AssignmentData, ocProductsService, OrderCloudConfirm, OrderCloud) {
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;

    vm.selectPrice = function(scope) {
        vm.loadingPrice = ocProductsService.AssignmentDataDetail(vm.listAssignments, scope.assignment.PriceSchedule.ID)
            .then(function(data) {
                vm.selectedPrice = scope.assignment;
                vm.selectedPrice.PriceSchedule = data.PriceSchedule;
                vm.selectedPrice.Availability = data.Buyers;
            })
    };

    vm.editPrice = function() {
        $uibModal.open({
            templateUrl: 'productManagement/templates/priceScheduleEdit.modal.html',
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
        OrderCloudConfirm.Confirm('Are you sure you want to delete this price and all of it\'s assignments? This action cannot be undone.')
            .then(function() {
                console.log('hit');
                vm.loadingPrice = OrderCloud.PriceSchedules.Delete(vm.selectedPrice.PriceSchedule.ID)
                    .then(function() {
                        delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
                        vm.selectedPrice = null;
                    })
            })
    };

    //====== Price Breaks =======
    vm.createPriceBreak = function() {
        $uibModal.open({
            templateUrl: 'productManagement/templates/priceSchedulePriceBreak.modal.html',
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
            templateUrl: 'productManagement/templates/priceScheduleAssignment.modal.html',
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
            console.log('assignment', assignment);
            if (assignment.UserGroup) {
                console.log('usergroups hit');
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
                console.log('end of if was hit');

            } else {
                assignment.Buyer.Assigned = true;
                angular.forEach(vm.listAssignments, function(val, key) {
                    var index = val.Buyers.indexOf(assignment.Buyer.ID);
                    if (index > -1) val.Buyers.splice(index, 1);
                });
                vm.listAssignments[assignment.PriceScheduleID].Buyers.push(assignment.Buyer.ID);
            }
            vm.selectedPrice.Availability.push(assignment.Buyer);
        });
    };

    vm.removeBuyerAssignment = function(scope) {
        if (vm.selectedPrice.Availability.length == 1) {
            //confirm they want to delete this price
            //delete price schedule if yes
            //cancel if no
        } else if (!scope.buyer.Assigned) {
            //delete all user group assignments
        } else {
            //delete buyer assignment
            OrderCloud.Products.DeleteAssignment($stateParams.productid, null, null, scope.buyer.ID)
                .then(function() {
                    vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers = _.without(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID].Buyers, scope.buyer.ID);
                    vm.selectedPrice.Availability.splice(scope.$index, 1);
                });
        }
    };

    vm.addUserGroupAssignment = function(scope) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/priceScheduleAssignment.modal.html',
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
                        if (group.UserGroupID == assignment.UserGroup.ID) vm.listAssignments[key].UserGroups.splice(index, 1);
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

function PriceScheduleDetailController($stateParams, $uibModal, OrderCloud, ocProductsService, ocPatchModal, AssignmentDataDetail) {
    var vm = this;
    vm.data = AssignmentDataDetail;

    var fields = {
        'Name': {Key: 'Name', Label: 'Name', Required: true},
        'ID': {Key: 'ID', Label: 'ID', Required: true},
        'MaxQuantity': {Key: 'MaxQuantity', Label: 'Maximum Quantity', Required: true, Type: 'number'}
    };

    vm.editFields = function(properties) {
        var propertiesList = _.filter(fields, function(field) { return properties.indexOf(field.Key) > -1});
        ocPatchModal.Edit('Edit Price Schedule', vm.data.PriceSchedule, propertiesList, 'PriceSchedules', function(partial) {
            return OrderCloud.PriceSchedules.Patch(vm.data.PriceSchedule.ID, partial)
        }).then(function(result) {
            vm.data.PriceSchedule = result;
        });
    };

    vm.patchField = function(field) {
        var partial = _.pick(vm.data.PriceSchedule, field);
        OrderCloud.PriceSchedules.Patch(vm.data.PriceSchedule.ID, partial)
            .then(function(data) {
                vm.data.PriceSchedule = data;
            });
    };

    vm.createPriceBreak = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/priceSchedulePriceBreak.modal.html',
            size: 'md',
            controller: 'PriceSchedulePriceBreakCtrl',
            controllerAs: 'priceBreak',
            resolve: {
                PriceScheduleID: function() {
                    return vm.data.PriceSchedule.ID;
                }
            }
        });

        modalInstance.result.then(function(priceSchedule) {
            vm.data.PriceSchedule = priceSchedule;
        });
    };

    vm.deletePriceBreak = function(scope) {
        OrderCloud.PriceSchedules.DeletePriceBreak(vm.data.PriceSchedule.ID, scope.pb.Quantity)
            .then(function() {
                vm.data.PriceSchedule.PriceBreaks.splice(scope.$index, 1);
            });
    };

    vm.buyerAssignmentChange = function(buyer) {
        if (buyer.Assigned) {
            ocProductsService.AssignBuyerRemoveUserGroups(buyer, $stateParams.productid, vm.data.PriceSchedule.ID)
                .then(function(data) {
                    buyer = data;
                });
        }
        else {
            OrderCloud.Products.DeleteAssignment($stateParams.productid, null, null, buyer.ID)
                .then(function() {
                    buyer.UserGroups = [];
                });
        }
    };

    vm.addUserGroupAssignment = function(buyer) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/priceScheduleAssignment.modal.html',
            size: 'md',
            controller: 'PriceScheduleCreateAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function() {
                    return {Items: [buyer]};
                },
                SelectedBuyer: function() {
                    return buyer;
                },
                BuyerUserGroups: function() {
                    return OrderCloud.UserGroups.List(null, 1, 20, null, null, null, buyer.ID);
                },
                AssignedBuyers: function() {
                    return null;
                },
                AssignedUserGroups: function() {
                    return buyer.UserGroups;
                }
            }
        });

        modalInstance.result.then(function(assignment) {
            var existingBuyer = _.where(vm.data.Buyers, {ID: assignment.BuyerID});
            if (existingBuyer) {
                angular.forEach(vm.data.Buyers, function(buyer) {
                    if (buyer.ID == assignment.Buyer.ID) {
                        buyer.UserGroups.push(assignment.UserGroup);
                    }
                });
            }
            else {
                assignment.Buyer.Assigned = true;
                if (assignment.UserGroup) assignment.Buyer.UserGroups = [assignment.UserGroup];
                vm.data.Buyers.push(assignment.Buyer);
            }
        });
    };

    vm.deleteUserGroupAssignment = function(buyer, group) {
        vm.loading = {
            message: 'Saving...'
        };
        vm.loading = OrderCloud.Products.DeleteAssignment($stateParams.productid, null, group.ID, buyer.ID)
            .then(function() {
                angular.forEach(vm.data.Buyers, function(b) {
                    if (b.ID == buyer.ID) {
                        angular.forEach(b.UserGroups, function(g, index) {
                            if (g.ID == group.ID) {
                                b.UserGroups.splice(index, 1);
                                if (!b.UserGroups.length) {
                                    b.Assigned = true;
                                    vm.buyerAssignmentChange(b);
                                }
                            }
                        });
                    }
                });
            });
    };

    vm.createAssignment = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/priceScheduleAssignment.modal.html',
            size: 'md',
            controller: 'PriceScheduleCreateAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function() {
                    return OrderCloud.Buyers.List(null, 1, 100);
                },
                SelectedBuyer: function() {
                    return null;
                },
                BuyerUserGroups: function() {
                    return null;
                },
                AssignedBuyers: function() {
                    return vm.data.Buyers;
                },
                AssignedUserGroups: function() {
                    return null;
                }
            }
        });

        modalInstance.result.then(function(assignment) {
            assignment.Buyer.Assigned = true;
            if (assignment.UserGroup) assignment.Buyer.UserGroups = [assignment.UserGroup];
            vm.data.Buyers.push(assignment.Buyer);
        });
    };

    vm.selectAllUserGroups = function(scope) {
        _.map(scope.buyer.UserGroups, function(ug) { ug.selected = scope.buyer.allGroupsSelected });
    };

    vm.selectUserGroup = function(buyer, scope) {
        if (!scope.userGroup.selected) buyer.allGroupsSelected = false;
    };
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

function PriceScheduleCreateAssignmentController($uibModalInstance, $stateParams, OrderCloud, ocProductsService, Buyers, SelectedBuyer, BuyerUserGroups, SelectedPrice, AssignedUserGroups) {
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
            vm.loading = ocProductsService.CreateAssignment(assignment)
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