angular.module('orderCloud')
    .factory('ocProducts', OrderCloudProducts)
;

function OrderCloudProducts($uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'productManagement/products/templates/productCreate.modal.html',
            controller: 'ProductCreateModalCtrl',
            controllerAs: 'productCreateModal'
        }).result
    }

    function _delete(product) {
        return ocConfirm.Confirm({message:'Are you sure you want to delete ' + product.Name + '? <br> <b>This action cannot be undone.</b>', confirmText: 'Delete this product', cancelText:'Cancel'})
            .then(function() {
                return OrderCloud.Products.Delete(product.ID)
            })
    }

    return service;
}