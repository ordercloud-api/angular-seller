angular.module('orderCloud')
    .controller('PromotionCreateModalCtrl', PromotionCreateModalController)
;

function PromotionCreateModalController($uibModalInstance, OrderCloudSDK, SelectedBuyerID) {
    var vm = this;
    vm.promotion = {};

    vm.submit = function() {
        vm.loading = OrderCloudSDK.Promotions.Create(vm.promotion)
            .then(function(newPromotion) {
                $uibModalInstance.close(newPromotion);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}