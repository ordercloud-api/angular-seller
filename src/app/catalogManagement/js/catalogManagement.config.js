angular.module('orderCloud')
    .config(CatalogManagementConfig)

function CatalogManagementConfig($stateProvider) {
    $stateProvider
        .state('catalogManagement', {
            parent: 'buyer',
            params: {
                preSelectID: undefined
            },
            url: '/catalog',
            resolve: {
                CatalogID: function(SelectedBuyer) {
                    //TODO: write unit test for this resolve
                    return SelectedBuyer.DefaultCatalogID;
                },
                Tree: function(CategoryTreeService, CatalogID) {
                    return CategoryTreeService.GetCategoryTree(CatalogID);
                }
            },
            templateUrl: 'catalogManagement/templates/catalogManagement.html',
            controller: 'CatalogManagementCtrl',
            controllerAs:'catalogManagement',
            data: {
                pageTitle: 'Buyer Catalog'
            }
        })
        .state('catalogManagement.category', {
            url: '/:categoryid',
            templateUrl: 'catalogManagement/templates/catalogManagementCategory.html',
            controller: 'CatalogManagementCategoryCtrl',
            controllerAs: 'catalogManagementCategory',
            resolve: {
                SelectedCategory: function($stateParams, OrderCloud, CatalogID) {
                    return OrderCloud.Categories.Get($stateParams.categoryid, CatalogID);
                }
            }
        })
        .state('catalogManagement.category.products', {
            url: '/products?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/templates/catalogManagementCategoryProducts.html',
            controller: 'CatalogManagementProductsCtrl',
            controllerAs: 'catalogManagementProducts',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, $stateParams, ocCatalogManagement, CatalogID) {
                    return ocCatalogManagement.Products.GetAssignments($stateParams.categoryid, CatalogID);
                },
                ProductList: function(OrderCloud, ocCatalogManagement, Parameters, CurrentAssignments) {
                    return OrderCloud.Products.List(Parameters.search, Parameters.page, Parameters.pageSize || 10, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
                        .then(function(data) {
                            return ocCatalogManagement.Products.MapAssignments(CurrentAssignments, data);
                        })
                }
            }
        })
        .state('catalogManagement.category.availability', {
            url: '/availability?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/templates/catalogManagementCategoryAvailability.html',
            controller: 'CatalogManagementAvailabilityCtrl',
            controllerAs: 'catalogManagementAvailability',
            params: {
                assignmentTypeOverride: undefined
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($stateParams, ocCatalogManagement, CatalogID) {
                    return ocCatalogManagement.Availability.GetAssignments($stateParams.categoryid, $stateParams.buyerid, CatalogID);
                },
                UserGroupList: function(OrderCloud, ocCatalogManagement, Parameters, CurrentAssignments) {
                    return OrderCloud.UserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 10, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            if (CurrentAssignments.Type == 'userGroups') {
                                return ocCatalogManagement.Availability.MapAssignments(CurrentAssignments.Items, data);
                            }
                            else {
                                return data;
                            }
                        });
                }
            }
        })
    ;
}