angular.module('orderCloud')
    .controller('UpdateProductPriceModalCtrl', UpdateProductPriceModalController);

function UpdateProductPriceModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, ocProductPricing, SelectPriceData) {
    var vm = this;
    vm.buyerName = SelectPriceData.Buyer.Name;
    vm.userGroupName = SelectPriceData.UserGroup ? SelectPriceData.UserGroup.Name : null;
    vm.product = SelectPriceData.Product;
    vm.selectedPriceSchedule = angular.copy(SelectPriceData.Product.SelectedPrice);
    vm.availablePriceSchedules = SelectPriceData.PriceScheduleList.Items;
    vm.removePrice = false;
    vm.showRemovePriceOption = SelectPriceData.Product.SelectedPrice && !SelectPriceData.Product.DefaultPriceScheduleID;

    vm.cancel = function () {
        $uibModalInstance.dismiss();
    };

    vm.createNewPrice = function () {
        $uibModalInstance.dismiss('CREATE');
    };

    vm.removeCurrentPrice = function () {
        vm.removePrice = true;
        vm.selectedPriceSchedule = null;
    };

    vm.selectNewPrice = function (scope) {
        vm.removePrice = false;
        vm.selectedPriceSchedule = scope.price;
    };

    vm.submit = function () {
        if (vm.removePrice) {
            vm.loading = ocProductPricing.RemovePrice(SelectPriceData, vm.availablePriceSchedules)
                .then(function (data) {
                    $uibModalInstance.close(data);
                })
                .catch(function (ex) {
                    $exceptionHandler(ex);
                });
        } else {
            vm.loading = ocProductPricing.SelectPrice(SelectPriceData, vm.selectedPriceSchedule, vm.availablePriceSchedules)
                .then(function (data) {
                    $uibModalInstance.close(data);
                })
                .catch(function (ex) {
                    $exceptionHandler(ex);
                });
        }

    };
}