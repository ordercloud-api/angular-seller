angular.module('orderCloud')
    .factory('ocAdminAddresses', OrderCloudAdminAddresses)
;

function OrderCloudAdminAddresses($uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'adminAddresses/templates/adminAddressCreate.modal.html',
            controller: 'AdminAddressCreateModalCtrl',
            controllerAs: 'adminAddressCreateModal'
        }).result
    }

    function _edit(address) {
        return $uibModal.open({
            templateUrl: 'adminAddresses/templates/adminAddressEdit.modal.html',
            controller: 'AdminAddressEditModalCtrl',
            controllerAs: 'adminAddressEditModal',
            resolve: {
                SelectedAddress: function() {
                    return address
                }
            }
        }).result
    }

    function _delete(address) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + (address.AddressName ? address.AddressName : address.ID) + '</b>?',
                confirmText: 'Delete admin address',
                type: 'delete'})
            .then(function() {
                return OrderCloud.AdminAddresses.Delete(address.ID)
            })
    }

    return service;
}