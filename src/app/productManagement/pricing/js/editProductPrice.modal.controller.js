angular.module('orderCloud')
    .controller('EditProductPriceModalCtrl', EditProductPriceModalController)
;

function EditProductPriceModalController($q, $uibModalInstance, OrderCloudSDK, SelectedPriceSchedule, IsDefault, ocProductPricing) {
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