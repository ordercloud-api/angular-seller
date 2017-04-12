angular.module('orderCloud')
    .factory('ocSellerUserGroups', OrderCloudSellerUserGroups)
;

function OrderCloudSellerUserGroups($uibModal, ocConfirm, OrderCloudSDK) {
    var service = {
        Create: _create,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'sellerUserGroups/templates/sellerUserGroupCreate.modal.html',
            controller: 'SellerUserGroupCreateModalCtrl',
            controllerAs: 'sellerUserGroupCreateModal'
        }).result;
    }

    function _delete(userGroup) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + userGroup.Name + '</b>?',
                confirmText: 'Delete seller user group',
                type: 'delete'})
            .then(function() {
                return OrderCloudSDK.AdminUserGroups.Delete(userGroup.ID);
            });
    }

    return service;
}