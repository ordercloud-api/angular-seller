angular.module('orderCloud')
    .factory('ocCatalogs', CatalogsService)
;

function CatalogsService($uibModal, ocConfirm, OrderCloudSDK) {
    var service = {
        Create: _create,
        Delete: _delete
    };

    function _create() {
        return $uibModal.open({
            templateUrl: 'catalogManagement/catalogs/templates/catalogCreate.modal.html',
            controller: 'CatalogCreateModalCtrl',
            controllerAs: 'catalogCreateModal'
        }).result;
    }


    function _delete(catalog) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + catalog.Name + '</b>? <br><br> This will delete all of the catalog\'s categories and product assignments.',
                confirmText: 'Delete catalog',
                type: 'delete'})
            .then(function() {
                return OrderCloudSDK.Catalogs.Delete(catalog.ID);
            });
    }

    return service;
}