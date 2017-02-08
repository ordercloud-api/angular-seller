angular.module('orderCloud')
    .factory('ocUserGroups', OrderCloudUserGroups)
;

function OrderCloudUserGroups($uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Delete: _delete
    };

    function _create(buyerid) {
        return $uibModal.open({
            templateUrl: 'userGroups/userGroups/templates/userGroupCreate.modal.html',
            controller: 'UserGroupCreateModalCtrl',
            controllerAs: 'userGroupCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _delete(userGroup, buyerid) {
        return ocConfirm.Confirm({message:'Are you sure you want to delete <b>' + userGroup.Name + '</b>? <br/> This action cannot be undone.', confirmText: 'Delete this user group', cancelText: 'Cancel'})
            .then(function() {
                return OrderCloud.UserGroups.Delete(userGroup.ID, buyerid)
            })
    }

    return service;
}