angular.module('orderCloud')
    .factory('ocSellerAddresses', OrderCloudSellerAddresses)
;

function OrderCloudSellerAddresses($uibModal, ocConfirm, OrderCloudSDK) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'sellerAddresses/templates/sellerAddressCreate.modal.html',
            controller: 'SellerAddressCreateModalCtrl',
            controllerAs: 'sellerAddressCreateModal'
        }).result;
    }

    function _edit(address) {
        return $uibModal.open({
            templateUrl: 'sellerAddresses/templates/sellerAddressEdit.modal.html',
            controller: 'SellerAddressEditModalCtrl',
            controllerAs: 'sellerAddressEditModal',
            resolve: {
                SelectedAddress: function() {
                    return address;
                }
            }
        }).result;
    }

    function _delete(address) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + (address.AddressName ? address.AddressName : address.ID) + '</b>?',
                confirmText: 'Delete seller address',
                type: 'delete'})
            .then(function() {
                return OrderCloudSDK.AdminAddresses.Delete(address.ID);
            });
    }

    return service;
}