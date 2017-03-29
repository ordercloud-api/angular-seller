angular.module('orderCloud')
    .controller('PromotionCreateModalCtrl', PromotionCreateModalController)
;

function PromotionCreateModalController($uibModalInstance, sdkOrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.promotion = {};

    vm.submit = function() {
        vm.loading = sdkOrderCloud.Promotions.Create(vm.promotion)
            .then(function(newPromotion) {
                $uibModalInstance.close(newPromotion);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}