angular.module('orderCloud')
    .controller('ApprovalRuleCreateModalCtrl', ApprovalRuleCreateModalController)
;

function ApprovalRuleCreateModalController($exceptionHandler, $uibModalInstance, OrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.approvalRule = {};

    vm.searchGroups = function(term) {
        return OrderCloud.UserGroups.List(term, 1, 6, null, null, null, SelectedBuyerID)
            .then(function(data) {
                return data.Items;
            })
    };

    vm.submit = function() {
        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.ApprovalRules.Create(vm.approvalRule, SelectedBuyerID)
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