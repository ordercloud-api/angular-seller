angular.module('orderCloud')
    .controller('CreateProductPriceModalCtrl', CreateProductPriceModalController);

function CreateProductPriceModalController($exceptionHandler, $uibModalInstance, SelectPriceData, ocProductPricing, toastr) {
    var vm = this;
    if (!SelectPriceData.DefaultPriceSchedule) {
        vm.buyerName = SelectPriceData.Buyer.Name;
        vm.userGroupName = SelectPriceData.UserGroup ? SelectPriceData.UserGroup.Name : null;
        vm.previousPriceSchedule = angular.copy(SelectPriceData.Product.SelectedPrice);
        vm.selectedBuyer = SelectPriceData.Buyer;
        vm.selectedUserGroup = SelectPriceData.UserGroup;
    }
    vm.product = SelectPriceData.Product;
    vm.priceSchedule = {
        RestrictedQuantity: false,
        PriceBreaks: [],
        MinQuantity: 1,
        OrderType: 'Standard'
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss();
    };

    vm.submit = function () {
        var userGroups = vm.selectedUserGroup ? [vm.selectedUserGroup] : [];
        if (SelectPriceData.DefaultPriceSchedule) vm.priceSchedule.Name = vm.product.Name + ' Default Price';
        vm.loading = ocProductPricing.CreatePrice(vm.product, vm.priceSchedule, vm.selectedBuyer, userGroups, SelectPriceData.DefaultPriceSchedule)
            .then(function (data) {
                if (!SelectPriceData.DefaultPriceSchedule) {
                    SelectPriceData.CurrentAssignments.push(data.Assignment);
                }
                $uibModalInstance.close({
                    SelectedPrice: data.NewPriceSchedule,
                    UpdatedAssignments: SelectPriceData.CurrentAssignments
                });
            })
            .catch(function (ex) {
                $exceptionHandler(ex);
            });
    };
}