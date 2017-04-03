angular.module('orderCloud')
    .controller('SelectPriceModalCtrl', SelectPriceModalController);

function SelectPriceModalController($exceptionHandler, $uibModalInstance, sdkOrderCloud, ocProductPricing, SelectPriceData) {
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
        vm.loading = ocProductPricing.SelectPrice(SelectPriceData, vm.selectedPriceSchedule, vm.availablePriceSchedules)
            .then(function(data) {
                $uibModalInstance.close(data);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}