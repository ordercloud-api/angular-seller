angular.module('orderCloud')
    .controller('SelectPriceModalCtrl', SelectPriceModalController);

function SelectPriceModalController($exceptionHandler, sdkOrderCloud, $uibModalInstance, SelectPriceData) {
    var vm = this;
    vm.buyerName = SelectPriceData.Buyer.Name;
    vm.product = SelectPriceData.Product;
    vm.selectedPriceSchedule = angular.copy(SelectPriceData.Product.SelectedPrice);
    vm.availablePriceSchedules = SelectPriceData.PriceScheduleList.Items;

    vm.cancel = function () {
        $uibModalInstance.dismiss();
    };

    vm.createNewPrice = function () {
        $uibModalInstance.dismiss('CREATE');
    };

    vm.submit = function () {
        function _checkOtherAssignments() {
            var otherAssignmentsExist = _.filter(SelectPriceData.CurrentAssignments, function(assignment) {
                return (SelectPriceData.Product.SelectedPrice && (assignment.ProductID === SelectPriceData.Product.ID) && (assignment.PriceScheduleID === SelectPriceData.Product.SelectedPrice.ID));
            }).length > 1;

            var index = _.findIndex(SelectPriceData.CurrentAssignments, function(assignment) {
                return (assignment.ProductID === SelectPriceData.Product.ID && assignment.BuyerID === SelectPriceData.Buyer.ID && !assignment.UserGroupID);
            });

            return {doesExist: otherAssignmentsExist, index: index};
        }

        if (SelectPriceData.Product.DefaultPriceScheduleID === vm.selectedPriceSchedule.ID) {
            var check = _checkOtherAssignments();
            var defaultPriceSchedule = _.findWhere(vm.availablePriceSchedules, {ID: SelectPriceData.Product.DefaultPriceScheduleID});

            if (check.doesExist) {
                sdkOrderCloud.Products.DeleteAssignment(SelectPriceData.Product.ID, SelectPriceData.Buyer.ID)
                    .then(function() {
                        SelectPriceData.CurrentAssignments.splice(check.index, 1);
                        $uibModalInstance.close({SelectedPrice: defaultPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                    });
            } else {
                sdkOrderCloud.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                    .then(function() {
                        SelectPriceData.CurrentAssignments.splice(check.index, 1);
                        $uibModalInstance.close({SelectedPrice: defaultPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                    });
            }
        } else {
            var assignment = {
                BuyerID: SelectPriceData.Buyer.ID,
                ProductID: SelectPriceData.Product.ID,
                PriceScheduleID: vm.selectedPriceSchedule.ID
            };
            vm.loading = sdkOrderCloud.Products.SaveAssignment(assignment)
                .then(function() {
                    var check = _checkOtherAssignments();
                    if (!check.doesExist && SelectPriceData.Product.SelectedPrice) {
                        sdkOrderCloud.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                            .then(function() {
                                _complete(true);
                            });
                    } else {
                        _complete(false);
                    }

                    function _complete(wasDeleted) {
                        wasDeleted ? (SelectPriceData.CurrentAssignments.splice(check.index, 1)) :
                            (check.index > -1 ? (SelectPriceData.CurrentAssignments[check.index] = assignment) : SelectPriceData.CurrentAssignments.push(assignment));
                        $uibModalInstance.close({SelectedPrice:vm.selectedPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                    }
                    
                })
                .catch(function(ex) {
                    if (ex.response.body.Errors[0].ErrorCode === 'Product.CannotAssignNotInBuyerCatalog') {
                        sdkOrderCloud.Catalogs.SaveProductAssignment({
                            catalogID:SelectPriceData.Buyer.DefaultCatalogID,
                            productID:SelectPriceData.Product.ID
                        }).then(function() {
                            vm.submit();
                        });
                    } else {
                        $exceptionHandler(ex);
                    }
                });
        }
    };
}