angular.module('orderCloud')
    .controller('ApprovalRuleCreateModalCtrl', ApprovalRuleCreateModalController)
;

function ApprovalRuleCreateModalController($exceptionHandler, $uibModalInstance, sdkOrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.approvalRule = {};

    vm.searchGroups = function(term) {
        return sdkOrderCloud.UserGroups.List(SelectedBuyerID, term, 1, 6, null, null, null)
            .then(function(data) {
                return data.Items;
            })
    };

    vm.submit = function() {
        vm.loading = {backdrop:false};
        vm.loading.promise = sdkOrderCloud.ApprovalRules.Create(SelectedBuyerID, vm.approvalRule)
            .then(function(newApprovalRule) {
                $uibModalInstance.close(newApprovalRule);
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}