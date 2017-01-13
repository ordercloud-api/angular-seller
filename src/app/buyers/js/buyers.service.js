angular.module('orderCloud')
    .factory('Buyers', BuyersService)
;

function BuyersService($uibModal) {
    var service = {
        Create: _create
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'buyers/templates/buyerCreate.modal.html',
            controller: 'BuyerCreateModalCtrl',
            controllerAs: 'buyerCreateModal',
            bindToController: true
        }).result
    }

    return service;
}