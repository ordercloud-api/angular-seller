angular.module('orderCloud')
    .config(UserGroupCatalogsConfig)
;

function UserGroupCatalogsConfig($stateProvider) {
    $stateProvider
        .state('userGroupCatalogs', {
            parent: 'userGroup',
            url: '/catalogs?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/userGroupCatalogs/templates/userGroupCatalogs.html',
            controller: 'UserGroupCatalogsCtrl',
            controllerAs: 'userGroupCatalogs',
            data: {
                pageTitle: 'User Group Catalogs'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($stateParams, ocCatalog) {
                    return ocCatalog.Assignments.Get(null, $stateParams.buyerid);
                },
                CatalogList: function(Parameters, CurrentAssignments, OrderCloudSDK) {
                    var catalogIDs = _.map(CurrentAssignments, 'CatalogID');
                    Parameters.filters.ID = catalogIDs.join('|');
                    Parameters.pageSize = 100;
                    return OrderCloudSDK.Catalogs.List(Parameters)
                        .then(function(data) {
                            angular.forEach(data.Items, function(catalog) {
                                var assignment = _.find(CurrentAssignments, {CatalogID: catalog.ID});
                                catalog.ViewAllProducts = assignment.ViewAllProducts;
                                catalog.ViewAllCategories = assignment.ViewAllCategories;
                            });
                            return data;
                        });
                }
            }
        });
}