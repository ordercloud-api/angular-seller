angular.module('orderCloud')
    .controller('ProductsCtrl', ProductsController)
    .controller('ProductCreateCtrl', ProductCreateController)
    .controller('ProductDetailCtrl', ProductDetailController)
    .controller('ProductSpecsCtrl', ProductSpecsController)
    .controller('ProductPricingCtrl', ProductPricingController)
    .controller('PriceScheduleEditModalCtrl', PriceScheduleEditModalController)
    .controller('ProductShippingCtrl', ProductShippingController)
    .controller('ProductInventoryCtrl', ProductInventoryController)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)
    .controller('PriceScheduleDetailCtrl', PriceScheduleDetailController)
    .controller('PriceSchedulePriceBreakCtrl', PriceSchedulePriceBreakController)
    .controller('PriceScheduleCreateAssignmentCtrl', PriceScheduleCreateAssignmentController)
;

function ProductsController($state, $ocMedia, OrderCloud, OrderCloudParameters, ProductList, Parameters) {
    var vm = this;
    vm.list = ProductList;
    //Set parameters
    vm.parameters = Parameters;
    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection);
    //Sort by is a filter on mobile devices
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;
    vm.showFilters = vm.filtersApplied;

    vm.clearFilters = clearFilters; //Clear relevant filters, reload the state & reset the page
    vm.clearSearch =  clearSearch; //Clear the search parameter, reload the state & reset the page
    vm.filter = filter; //Reload the state with new parameters
    vm.loadMore = loadMore; //Load the next page of results with all of the same parameters
    vm.pageChanged = pageChanged; //Reload the state with the incremented page parameter
    vm.reverseSort = reverseSort; //Used on mobile devices
    vm.search = search; //Reload the state with new search parameter & reset the page
    vm.updateSort = updateSort; //Conditionally set, reverse, remove the sortBy parameter & reload the state

    function filter(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    }

    function search() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.Products.List(vm.parameters.search, 1, vm.parameters.pageSize || 12, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
    };

    function clearSearch() {
        vm.parameters.search = null;
        vm.filter(true);
    }

    function clearFilters() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    }

    function updateSort(value) {
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
    }

    function reverseSort() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    }

    function pageChanged() {
        $state.go('.', {page:vm.list.Meta.Page});
    }

    function loadMore() {
        return OrderCloud.Products.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    }
}

function ProductCreateController($exceptionHandler, $state, toastr, OrderCloud) {
    var vm = this;

    vm.product = {};
    vm.product.Active = true;
    vm.product.QuantityMultiplier = 1;

    vm.submit = submit;

    function submit() {
        OrderCloud.Products.Create(vm.product)
            .then(function(data) {
                vm.product.ID = data.ID;
                toastr.success('Product Saved', 'Success');
                $state.go('products.detail.createAssignment', {productid: vm.product.ID}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function ProductDetailController($exceptionHandler, $state, toastr, OrderCloud, OrderCloudConfirm, SelectedProduct) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.inventoryEnabled = angular.copy(SelectedProduct.InventoryEnabled);
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;

    function updateProduct() {
        var partial = _.pick(vm.product, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'InventoryEnabled']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(SelectedProduct.ID, partial)
            .then(function(data) {
                vm.product = angular.copy(data);
                vm.productName = angular.copy(data.Name);
                vm.inventoryEnabled = angular.copy(data.InventoryEnabled);
                SelectedProduct = data;
                vm.InfoForm.$setPristine();
                toastr.success(data.Name + ' was updated', 'Success!');
            })
    }

    function deleteProduct(){
        OrderCloudConfirm.Confirm('Are you sure you want to delete this product?')
            .then(function(){
                OrderCloud.Products.Delete(vm.productID)
                    .then(function() {
                        toastr.success('Product Deleted', 'Success');
                        $state.go('products', {}, {reload: true});
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex)
                    });
            });
    }
}

function ProductSpecsController(ProductSpecs) {
    var vm = this;
    vm.specs = angular.copy(ProductSpecs);
}

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
                });
                vm.listAssignments[assignment.PriceScheduleID].Buyers.push(assignment.Buyer.ID);
            }
            vm.selectedPrice.Availability.push(assignment.Buyer);
        });
    };

    vm.removeBuyerAssignment = function(scope) {
        vm.availabilityLoading = [];
        if (vm.selectedPrice.Availability.length == 1) {
            OrderCloudConfirm.Confirm("Removing the last buyer organization will remove this price from the product entirely. Do you wish to continue?")
                .then(function() {
                    vm.availabilityLoading[scope.$index] = OrderCloud.PriceSchedules.Delete(vm.selectedPrice.PriceSchedule.ID)
                        .then(function() {
                            delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
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
                        if (group.UserGroupID == assignment.UserGroup.ID && assignment.Buyer.ID == group.BuyerID) vm.listAssignments[key].UserGroups.splice(index, 1);
                        if (!vm.listAssignments[key].UserGroups.length && !vm.listAssignments[key].Buyers.length) {
                            OrderCloud.PriceSchedules.Delete(key)
                                .then(function() {
                                    delete vm.listAssignments[key];
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
            //TODO: Confirm if they want to assign this at the buyer level, if so, unassign all groups and assign to the buyer - update the VM
            vm.removeBuyerAssignment(scope);
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

function ProductShippingController(toastr, OrderCloud, AdminAddresses) {
    var vm = this;
    vm.adminAddresses = AdminAddresses;
    vm.updateProductShipping = updateProductShipping;
    vm.listAllAdminAddresses = listAllAdminAddresses;

    function updateProductShipping(product) {
        var partial = _.pick(product, ['ShipWeight', 'ShipHeight', 'ShipWidth', 'ShipLength', 'ShipFromAddressID']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(product.ID, partial)
            .then(function() {
                vm.ProductShippingForm.$setPristine();
                toastr.success(product.Name + ' shipping was updated', 'Success!');
            });
    }

    function listAllAdminAddresses(search){
        return OrderCloud.AdminAddresses.List(search)
            .then(function(data){
                vm.adminAddresses = data;
            });
    }
}

function ProductInventoryController(toastr, ocProductsService, ProductInventory) {
    var vm = this;
    vm.inventory = angular.copy(ProductInventory);
    vm.inventoryAvailable = angular.copy(ProductInventory.Available);
    vm.updateProductInventory = updateProductInventory;

    function updateProductInventory(product) {
        vm.productUpdateLoading = ocProductsService.UpdateInventory(product, vm.inventory)
            .then(function(inventory) {
                vm.inventory = angular.copy(inventory);
                vm.inventoryAvailable = angular.copy(inventory.Available);
                vm.ProductInventoryForm.$setPristine();
                toastr.success(product.Name + ' inventory was updated', 'Success!');
            });
    }
}

function ProductCreateAssignmentController($state, toastr, OrderCloud, ocProductsService, SelectedProduct, Buyers, PriceBreak) {
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
        ocProductsService.CreateNewPriceScheduleAndAssignments(vm.product, vm.priceSchedule, vm.selectedBuyer, vm.selectedUserGroups)
            .then(function(data) {
                toastr.success('Assignment Created', 'Success');
                $state.go('^', {}, {reload: true});
            })
            .catch(function (ex) {
                toastr.error('An error occurred while trying to save your product assignment', 'Error');
            });
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