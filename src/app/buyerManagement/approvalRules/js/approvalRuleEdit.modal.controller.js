angular.module('orderCloud')
    .controller('ApprovalRuleEditModalCtrl', ApprovalRuleEditModalController)
;


function ApprovalRuleEditModalController($exceptionHandler, $uibModalInstance, OrderCloud, SelectedApprovalRule, SelectedBuyerID) {
    var vm = this;
    vm.approvalRule = angular.copy(SelectedApprovalRule);
    vm.approvalRuleName = SelectedApprovalRule.Name;

    vm.searchGroups = function(term) {
        return OrderCloud.UserGroups.List(term, 1, 6, null, null, null, SelectedBuyerID)
            .then(function(data) {
                return data.Items;
            })
    };

    vm.submit = function() {
        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.ApprovalRules.Update(SelectedApprovalRule.ID, vm.approvalRule, SelectedBuyerID)
            .then(function(updatedApprovalRule) {
                $uibModalInstance.close(updatedApprovalRule);
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}
