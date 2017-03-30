angular.module('orderCloud')
    .config(BuyerCatalogConfig)
;

function BuyerCatalogConfig($stateProvider) {
    $stateProvider
        .state('buyerCatalog', {
            parent: 'buyer',
            url: '/catalog/:catalogid',
            templateUrl: 'catalogManagement/buyerCatalog/templates/buyerCatalog.html',
            controller: 'BuyerCatalogCtrl',
            controllerAs: 'buyerCatalog',
            data: {
                pageTitle: 'Buyer Catalog'
            },
            resolve: {
                SelectedCatalog: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.Catalogs.Get($stateParams.catalogid);
                },
                CatalogAssignment: function($stateParams, sdkOrderCloud) {
                    var options = {
                        catalogID: $stateParams.catalogid,
                        buyerID: $stateParams.buyerid
                    }
                    return sdkOrderCloud.Catalogs.ListAssignments(options)
                        .then(function(data) {
                            return data.Items[0];
                        });
                },
                CategoryAssignments: function($stateParams, ocCatalogCategories) {
                    return ocCatalogCategories.Assignments.Get($stateParams.catalogid, $stateParams.buyerid);
                },
                CategoryList: function($stateParams, ocCatalogCategories) {
                    return ocCatalogCategories.GetAll($stateParams.catalogid);
                },
                Tree: function(CategoryList, ocCatalogTree, ocCatalogCategories, CategoryAssignments, CatalogAssignment) {
                    return ocCatalogTree.Get(ocCatalogCategories.Assignments.Map(CategoryList, CatalogAssignment.ViewAllCategories ? true : CategoryAssignments));
                }
            }
        })
}