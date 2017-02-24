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
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + buyer.Name + '</b>? <br><br> This will delete all of the buyer\'s data.',
                confirmText: 'Delete buyer organization',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Buyers.Delete(buyer.ID)
            })
    }

    return service;
}