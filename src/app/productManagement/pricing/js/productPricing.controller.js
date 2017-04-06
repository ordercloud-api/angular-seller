angular.module('orderCloud')
    .controller('ProductPricingCtrl', ProductPricingController)
    .controller('PriceScheduleEditModalCtrl', PriceScheduleEditModalController);

function ProductPricingController($q, $rootScope, $stateParams, $uibModal, toastr, AssignmentList, AssignmentData, ocProductPricing, ocConfirm, SelectedProduct) {
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;
    var isDefault;

    vm.noPricesSet = !_.keys(vm.listAssignments).length;
    vm.noOverridesSet = _.keys(vm.listAssignments).length === 1 && SelectedProduct.DefaultPriceScheduleID;

    vm.selectPrice = function (scope) {
        vm.loadingPrice = ocProductPricing.AssignmentDataDetail(vm.listAssignments, scope.assignment.PriceSchedule.ID)
            .then(function (data) {
                vm.selectedPrice = scope.assignment;
                vm.selectedPrice.PriceSchedule = data.PriceSchedule;
                vm.selectedPrice.Availability = data.Buyers;
                isDefault = SelectedProduct.DefaultPriceScheduleID === data.PriceSchedule.ID;
            });
    };

    if (SelectedProduct.DefaultPriceScheduleID && !$stateParams.pricescheduleid) {
        vm.selectPrice({
            assignment: vm.listAssignments[SelectedProduct.DefaultPriceScheduleID]
        });
    } else if ($stateParams.pricescheduleid && vm.listAssignments[$stateParams.pricescheduleid]) {
        vm.selectPrice({
            assignment: vm.listAssignments[$stateParams.pricescheduleid]
        });
    } else if (_.keys(vm.listAssignments).length) {
        vm.selectPrice({
            assignment: vm.listAssignments[_.keys(vm.listAssignments)[0]]
        });
    }

    vm.editPrice = function () {
        ocProductPricing.EditPrice(vm.selectedPrice.PriceSchedule, isDefault)
            .then(function (updatedPriceSchedule) {
                if (isDefault && updatedPriceSchedule.ID !== vm.selectedPrice.PriceSchedule.ID) $rootScope.$broadcast('OC:DefaultPriceUpdated', updatedPriceSchedule.ID);
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
                toastr.success(vm.selectedPrice.Name + ' was updated.');
            });
    };

    vm.deletePrice = function () {
        ocProductPricing.DeletePrice(vm.selectedPrice.PriceSchedule)
            .then(function () {
                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
                vm.noPricesSet = _.keys(vm.listAssignments).length === 0;
                toastr.success(vm.selectedPrice.PriceSchedule.Name + ' was deleted');
                vm.selectedPrice = null;
            });
    };
}

function PriceScheduleEditModalController($q, $uibModalInstance, OrderCloudSDK, SelectedPriceSchedule, IsDefault, ocProductPricing) {
    var vm = this;
    vm.data = angular.copy(SelectedPriceSchedule);
    vm.priceScheduleName = SelectedPriceSchedule.Name;
    vm.isDefault = IsDefault;

    vm.submit = function () {
        var previous = {},
            current = {};

        _.each(SelectedPriceSchedule.PriceBreaks, function (pb) {
            previous[pb.Quantity] = pb.Price;
        });

        _.each(vm.data.PriceBreaks, function (pb) {
            current[pb.Quantity] = pb.Price;
        });

        var createQueue = [];
        var deleteQueue = [];

        angular.forEach(current, function (price, quantity) {
            if (!previous[quantity] || (previous[quantity] && previous[quantity] !== price)) {
                createQueue.push(OrderCloudSDK.PriceSchedules.SavePriceBreak(SelectedPriceSchedule.ID, {
                    Quantity: quantity,
                    Price: price
                }));
            }
        });

        angular.forEach(previous, function (price, quantity) {
            if (!current[quantity]) deleteQueue.push(OrderCloudSDK.PriceSchedules.DeletePriceBreak(SelectedPriceSchedule.ID, quantity));
        });

        vm.loading = $q.all(createQueue)
            .then(function () {
                return $q.all(deleteQueue)
                    .then(function () {
                        return OrderCloudSDK.PriceSchedules.Update(SelectedPriceSchedule.ID, vm.data)
                            .then(function (updatedPriceSchedule) {
                                ocProductPricing.PriceBreaks.FormatQuantities(updatedPriceSchedule.PriceBreaks);
                                $uibModalInstance.close(updatedPriceSchedule);
                            });
                    });
            });
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss();
    };
}