angular.module('orderCloud')
    .controller('SelectPriceModalCtrl', SelectPriceModalController);

function SelectPriceModalController($exceptionHandler, $uibModalInstance, sdkOrderCloud, ocProducts, SelectPriceData) {
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
        if (SelectPriceData.Product.DefaultPriceScheduleID === vm.selectedPriceSchedule.ID) {
            var check = ocProducts.CheckOtherAssignments(SelectPriceData);
            var defaultPriceSchedule = _.findWhere(vm.availablePriceSchedules, {ID: SelectPriceData.Product.DefaultPriceScheduleID});

            if (check.DoesExist) {
                sdkOrderCloud.Products.DeleteAssignment(SelectPriceData.Product.ID, SelectPriceData.Buyer.ID)
                    .then(function() {
                        SelectPriceData.CurrentAssignments.splice(check.Index, 1);
                        $uibModalInstance.close({SelectedPrice: defaultPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                    });
            } else {
                sdkOrderCloud.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                    .then(function() {
                        SelectPriceData.CurrentAssignments.splice(check.Index, 1);
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
                    var check = ocProducts.CheckOtherAssignments(SelectPriceData);
                    if (!check.DoesExist && SelectPriceData.Product.SelectedPrice) {
                        sdkOrderCloud.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                            .then(function() {
                                _complete(true);
                            });
                    } else {
                        _complete(false);
                    }

                    function _complete(wasDeleted) {
                        wasDeleted ? (SelectPriceData.CurrentAssignments.splice(check.Index, 1)) :
                            (check.Index > -1 ? (SelectPriceData.CurrentAssignments[check.Index] = assignment) : SelectPriceData.CurrentAssignments.push(assignment));
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