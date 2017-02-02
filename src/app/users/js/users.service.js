angular.module('orderCloud')
    .factory('ocUsers', OrderCloudUsers)
;

function OrderCloudUsers($exceptionHandler, $uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete
    };

    function _create(buyerid) {
        return $uibModal.open({
            templateUrl: 'users/templates/userCreate.modal.html',
            controller: 'UserCreateModalCtrl',
            controllerAs: 'userCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _edit(user, buyerid) {
        return $uibModal.open({
            templateUrl: 'users/templates/userEdit.modal.html',
            controller: 'UserEditModalCtrl',
            controllerAs: 'userEditModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                },
                SelectedUser: function() {
                    return user;
                }
            }
        }).result
    }

    function _delete(user, buyerid) {
        return ocConfirm.Confirm({message:'Are you sure you want to delete ' + user.Username + '? <br/> <b>This action cannot be undone.</b>', confirmText: 'Yes, delete this user', cancelText: 'Cancel'})
            .then(function() {
                return OrderCloud.Users.Delete(user.ID, buyerid)
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            })
    }

    return service;
}