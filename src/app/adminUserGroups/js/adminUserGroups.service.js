angular.module('orderCloud')
    .factory('ocAdminUserGroups', OrderCloudAdminUserGroups)
;

function OrderCloudAdminUserGroups($uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'adminUserGroups/templates/adminUserGroupCreate.modal.html',
            controller: 'AdminUserGroupCreateModalCtrl',
            controllerAs: 'adminUserGroupCreateModal'
        }).result
    }

    function _delete(userGroup) {
        return ocConfirm.Confirm({message:'Are you sure you want to delete <b>' + userGroup.Name + '</b>? <br/> This action cannot be undone.', confirmText: 'Delete this user group', cancelText: 'Cancel'})
            .then(function() {
                return OrderCloud.AdminUserGroups.Delete(userGroup.ID)
            })
    }

    return service;
}