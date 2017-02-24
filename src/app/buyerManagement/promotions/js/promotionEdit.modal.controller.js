angular.module('orderCloud')
    .controller('PromotionEditModalCtrl', PromotionEditModalController)
;

function PromotionEditModalController($uibModalInstance, OrderCloud, SelectedPromotion, SelectedBuyerID) {
    var vm = this;
    vm.promotion = angular.copy(SelectedPromotion);
    vm.promotionName = SelectedPromotion.Name ? SelectedPromotion.Name : SelectedPromotion.Code;
    if (vm.promotion.StartDate) vm.promotion.StartDate = new Date(vm.promotion.StartDate);
    if (vm.promotion.ExpirationDate) vm.promotion.ExpirationDate = new Date(vm.promotion.ExpirationDate);

    vm.submit = function() {
        vm.loading = OrderCloud.Promotions.Update(SelectedPromotion.ID, vm.promotion, SelectedBuyerID)
            .then(function(updatedPromotion) {
                $uibModalInstance.close(updatedPromotion);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}