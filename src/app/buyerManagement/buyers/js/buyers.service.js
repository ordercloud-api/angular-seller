angular.module('orderCloud')
    .factory('ocBuyers', BuyersService)
;

function BuyersService($uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'buyerManagement/buyers/templates/buyerCreate.modal.html',
            controller: 'BuyerCreateModalCtrl',
            controllerAs: 'buyerCreateModal',
            bindToController: true
        }).result
    }


    function _delete(buyer) {
        return ocConfirm.Confirm({message:'Are you sure you want to delete ' + buyer.Name + ' and all of it\'s data? <br/> <b>This action cannot be undone.</b>', confirmText: 'Delete this buyer', cancelText: 'Cancel'})
            .then(function() {
                return OrderCloud.Buyers.Delete(buyer.ID)
            })
    }

    return service;
}