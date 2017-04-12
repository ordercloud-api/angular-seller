angular.module('orderCloud')
    .config(CatalogConfig);

function CatalogConfig($stateProvider) {
    $stateProvider
        .state('catalog', {
            parent: 'base',
            url: '/catalog/:catalogid',
            templateUrl: 'catalogManagement/catalog/templates/catalog.html',
            controller: 'CatalogCtrl',
            controllerAs: 'catalog',
            resolve: {
                SelectedCatalog: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Catalogs.Get($stateParams.catalogid);
                }
            }
        })
        .state('catalog.buyers', {
            url: '/buyers?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/catalog/templates/catalogBuyers.html',
            controller: 'CatalogBuyersCtrl',
            controllerAs: 'catalogBuyers',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($stateParams, ocCatalog) {
                    return ocCatalog.Assignments.Get($stateParams.catalogid);
                },
                BuyerList: function(OrderCloudSDK, ocCatalog, Parameters, CurrentAssignments) {
                    return OrderCloudSDK.Buyers.List(Parameters)
                        .then(function(data) {
                            return ocCatalog.Assignments.Map(CurrentAssignments, data);
                        });
                }
            }
        })
        .state('categories', {
            parent: 'catalog',
            params: {
                preSelectID: undefined
            },
            url: '/categories',
            templateUrl: 'catalogManagement/catalog/templates/catalogCategories.html',
            controller: 'CatalogCategoriesCtrl',
            controllerAs:'catalogCategories',
            data: {
                pageTitle: 'Catalog Categories'
            },
            resolve: {
                CategoryList: function($stateParams, ocCatalogCategories) {
                    return ocCatalogCategories.GetAll($stateParams.catalogid);
                },
                Tree: function(CategoryList, ocCatalogTree) {
                    return ocCatalogTree.Get(CategoryList);
                }
            }
        })
        .state('categories.category', {
            url: '/:categoryid',
            templateUrl: 'catalogManagement/catalog/templates/catalogCategory.html',
            controller: 'CatalogCategoryCtrl',
            controllerAs: 'catalogCategory',
            resolve: {
                SelectedCategory: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Categories.Get($stateParams.catalogid, $stateParams.categoryid);
                }
            }
        })
        .state('categories.category.products', {
            url: '/products?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'catalogManagement/catalog/templates/catalogCategoryProducts.html',
            controller: 'CatalogProductsCtrl',
            controllerAs: 'catalogProducts',
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, $stateParams, ocCatalog) {
                    return ocCatalog.Products.GetAssignments($stateParams.categoryid, $stateParams.catalogid);
                },
                ProductList: function(OrderCloudSDK, ocCatalog, Parameters, CurrentAssignments) {
                    return OrderCloudSDK.Products.List(Parameters)
                        .then(function(data) {
                            return ocCatalog.Products.MapAssignments(CurrentAssignments, data);
                        });
                }
            }
        })
    ;
}