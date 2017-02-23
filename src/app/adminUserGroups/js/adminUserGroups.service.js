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
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + userGroup.Name + '</b>?',
                confirmText: 'Delete admin user group',
                type: 'delete'})
            .then(function() {
                return OrderCloud.AdminUserGroups.Delete(userGroup.ID)
            })
    }

    return service;
}