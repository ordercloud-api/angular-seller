angular.module('orderCloud')
    .controller('ProductsCtrl', ProductsController)
    .controller('ProductCreateCtrl', ProductCreateController)
    .controller('ProductDetailCtrl', ProductDetailController)
    .controller('ProductInventoryCtrl', ProductInventoryController)
    .controller('ProductPricingCtrl', ProductPricingController)
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
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;

    function updateProduct() {
        var partial = _.pick(vm.product, ['ID', 'Name', 'Description', 'QuantityMultiplier']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(SelectedProduct.ID, partial)
            .then(function(data) {
                vm.product = angular.copy(data);
                vm.productName = angular.copy(data.Name);
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

function ProductInventoryController(ProductInventory) {
    var vm = this;
    vm.inventory = angular.copy(ProductInventory);
}

function ProductPricingController(AssignmentList, AssignmentData) {
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;

    vm.priceSelected = function(ID) {
        vm.selectedAssignmentID = ID;
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
}

function PriceSchedulePriceBreakController($uibModalInstance, OrderCloud, PriceScheduleID) {
    var vm = this;
    vm.priceBreak = {
        Quantity: 1,
        Price: 0
    };

    vm.confirm = function() {
        vm.loading = {
            message: 'Saving...'
        };
        vm.loading = OrderCloud.PriceSchedules.SavePriceBreak(PriceScheduleID, vm.priceBreak)
            .then(function(priceSchedule) {
                $uibModalInstance.close(priceSchedule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function PriceScheduleCreateAssignmentController($uibModalInstance, $stateParams, OrderCloud, ocProductsService, Buyers, SelectedBuyer, BuyerUserGroups, AssignedBuyers, AssignedUserGroups) {
    var vm = this;
    vm.buyers = {Items: []};
    vm.selectedBuyer = SelectedBuyer;
    vm.preSelectedBuyer = SelectedBuyer != null;
    vm.buyerUserGroups = {Items: []};
    vm.assignAtUserGroupLevel = vm.preSelectedBuyer;

    var assignedBuyerIDs = _.pluck(AssignedBuyers, 'ID');
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
        vm.loading = {
            message: 'Saving...'
        };
        var assignment = {
            ProductID: $stateParams.productid,
            PriceScheduleID: $stateParams.pricescheduleid,
            BuyerID: vm.selectedBuyer.ID
        };
        if (vm.selectedUserGroup) assignment.UserGroupID = vm.selectedUserGroup.ID;
        vm.loading.promise = ocProductsService.CreateAssignment(assignment)
            .then(function(data) {
                $uibModalInstance.close({Buyer: vm.selectedBuyer, UserGroup: vm.selectedUserGroup});
            })
            .catch(function(ex) {
                $uibModalInstance.dismiss();
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}