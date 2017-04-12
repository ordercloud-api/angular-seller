angular.module('orderCloud')
    .factory('ocCatalogs', CatalogsService);

function CatalogsService($q, $uibModal, ocConfirm, OrderCloudSDK) {
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
        var deferred = $q.defer();

        ocConfirm.Confirm({
                message: 'Are you sure you want to delete <br> <b>' + catalog.Name + '</b>? <br><br> This will delete all of the catalog\'s categories and product assignments.',
                confirmText: 'Delete catalog',
                type: 'delete'
            })
            .then(function () {
                isDefaultCatalog();
            })
            .catch(function (ex) {
                deferred.reject(ex);
            });

        function isDefaultCatalog() {
            OrderCloudSDK.Buyers.List({filters: {DefaultCatalogID: catalog.ID}})
                .then(function (data) {
                    if (data.Items.length > 0) {
                        catalogSelect(data);
                    } else {
                        deleteCatalog();
                    }
                })
                .catch(function (ex) {
                    deferred.reject(ex);
                });
        }

        function catalogSelect(buyerListData) {
            $uibModal.open({
                    templateUrl: 'catalogManagement/catalogs/templates/catalogSelect.modal.html',
                    controller: 'CatalogSelectModalCtrl',
                    controllerAs: 'catalogSelectModal',
                    resolve: {
                        BuyerList: function () {
                            return buyerListData;
                        }
                    }
                }).result
                .then(function (replacementCatalog) {
                    assignBuyers(buyerListData.Items, replacementCatalog);
                })
                .catch(function (ex) {
                    deferred.reject(ex);
                });
        }

        function assignBuyers(buyers, defaultCatalog) {
            var assignQueue = [];

            angular.forEach(buyers, function(buyer) {
                assignQueue.push(OrderCloudSDK.Catalogs.SaveAssignment({
                    catalogID:defaultCatalog.ID,
                    buyerID:buyer.ID,
                    ViewAllCategories:true,
                    ViewAllProducts:true
                }));
            });

            $q.all(assignQueue)
                .then(function() {
                    patchBuyers(buyers, defaultCatalog);
                });
        }

        function patchBuyers(buyers, defaultCatalog) {
            var patchQueue = [];

            angular.forEach(buyers, function(buyer) {
                patchQueue.push(OrderCloudSDK.Buyers.Patch(buyer.ID, {DefaultCatalogID:defaultCatalog.ID}));
            });

            $q.all(patchQueue)
                .then(function() {
                    deleteCatalog();
                });
        }

        function deleteCatalog() {
            deferred.resolve(OrderCloudSDK.Catalogs.Delete(catalog.ID));
        }


        return deferred.promise;

    }

    return service;
}