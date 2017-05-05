angular.module('orderCloud')
    .controller('ApprovalRuleEditModalCtrl', ApprovalRuleEditModalController)
;


function ApprovalRuleEditModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, SelectedApprovalRule, SelectedBuyerID) {
    var vm = this;
    vm.approvalRule = angular.copy(SelectedApprovalRule);
    vm.approvalRuleName = SelectedApprovalRule.Name;

    vm.searchGroups = function(term) {
        return OrderCloudSDK.UserGroups.List(SelectedBuyerID, term, 1, 6, null, null, null)
            .then(function(data) {
                return data.Items;
            });
    };

    vm.submit = function() {
        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloudSDK.ApprovalRules.Update(SelectedBuyerID, SelectedApprovalRule.ID, vm.approvalRule)
            .then(function(updatedApprovalRule) {
                $uibModalInstance.close(updatedApprovalRule);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}
