angular.module('orderCloud')
    .factory('ocApprovalRules', OrderCloudApprovalRules)
;

function OrderCloudApprovalRules($q, $uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete
    };

    function _create(buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/approvalRules/templates/approvalRuleCreate.modal.html',
            controller: 'ApprovalRuleCreateModalCtrl',
            controllerAs: 'approvalRuleCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _edit(approvalRule, buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/approvalRules/templates/approvalRuleEdit.modal.html',
            controller: 'ApprovalRuleEditModalCtrl',
            controllerAs: 'approvalRuleEditModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                },
                SelectedApprovalRule: function() {
                    return approvalRule;
                }
            }
        }).result
    }

    function _delete(approvalRule, buyerid) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + approvalRule.Name + '</b>?',
                confirmText: 'Delete approval rule',
                type: 'delete'})
            .then(function() {
                return OrderCloud.ApprovalRules.Delete(approvalRule.ID, buyerid)
            })
    }

    return service;
}