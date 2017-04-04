angular.module('orderCloud')
    .controller('ProductPricingCtrl', ProductPricingController)
    .controller('PriceScheduleEditModalCtrl', PriceScheduleEditModalController)
    .controller('PriceSchedulePriceBreakCreateCtrl', PriceSchedulePriceBreakCreateController)
    .controller('PriceSchedulePriceBreakEditCtrl', PriceSchedulePriceBreakEditController)
;

function ProductPricingController($q, $stateParams, $uibModal, toastr, AssignmentList, AssignmentData, ocProductPricing, ocConfirm, OrderCloud, SelectedProduct) {
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;

    vm.noPricesSet = !_.keys(vm.listAssignments).length;
    vm.noOverridesSet = _.keys(vm.listAssignments).length === 1 && SelectedProduct.DefaultPriceScheduleID;

    vm.selectPrice = function(scope) {
        vm.loadingPrice = ocProductPricing.AssignmentDataDetail(vm.listAssignments, scope.assignment.PriceSchedule.ID)
            .then(function(data) {
                vm.selectedPrice = scope.assignment;
                vm.selectedPrice.PriceSchedule = data.PriceSchedule;
                vm.selectedPrice.Availability = data.Buyers;
            });
    };

    if (SelectedProduct.DefaultPriceScheduleID && !$stateParams.pricescheduleid) {
        vm.selectPrice({assignment:vm.listAssignments[SelectedProduct.DefaultPriceScheduleID]});
    } else if ($stateParams.pricescheduleid && vm.listAssignments[$stateParams.pricescheduleid]) {
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
}

function PriceScheduleEditModalController($uibModalInstance, sdkOrderCloud, SelectedPriceSchedule) {
    var vm = this;
    vm.data = angular.copy(SelectedPriceSchedule);
    vm.priceScheduleName = SelectedPriceSchedule.Name;

    vm.submit = function() {
        vm.loading = sdkOrderCloud.PriceSchedules.Update(SelectedPriceSchedule.ID, vm.data)
            .then(function(updatedPriceSchdule) {
                $uibModalInstance.close(updatedPriceSchdule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function PriceSchedulePriceBreakCreateController($uibModalInstance, sdkOrderCloud, PriceScheduleID) {
    var vm = this;
    vm.priceBreak = {
        Quantity: 1,
        Price: null
    };

    vm.confirm = function() {
        vm.loading = sdkOrderCloud.PriceSchedules.SavePriceBreak(PriceScheduleID, vm.priceBreak)
            .then(function(priceSchedule) {
                $uibModalInstance.close(priceSchedule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function PriceSchedulePriceBreakEditController($uibModalInstance, sdkOrderCloud, PriceScheduleID, PriceBreak) {
    var vm = this;
    vm.priceBreak = angular.copy(PriceBreak);

    vm.confirm = function() {
        vm.loading = sdkOrderCloud.PriceSchedules.SavePriceBreak(PriceScheduleID, vm.priceBreak)
            .then(function(priceSchedule) {
                $uibModalInstance.close(priceSchedule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}