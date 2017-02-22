angular.module('orderCloud')
    .controller('PromotionCreateModalCtrl', PromotionCreateModalController)
;

function PromotionCreateModalController($uibModalInstance, OrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.promotion = {};

    vm.submit = function() {
        vm.loading = OrderCloud.Promotions.Create(vm.promotion, SelectedBuyerID)
            .then(function(newPromotion) {
                $uibModalInstance.close(newPromotion);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}