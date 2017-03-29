angular.module('orderCloud')
    .config(CatalogConfig)

function CatalogConfig($stateProvider) {
    $stateProvider
        .state('catalog', {
            parent: 'base',
            abstract: true,
            url: '/catalog/:catalogid',
            templateUrl: 'catalogManagement/catalog/templates/catalog.html',
            controller: 'CatalogCtrl',
            controllerAs: 'catalog',
            resolve: {
                SelectedCatalog: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.Catalogs.Get($stateParams.catalogid);
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
                BuyerList: function(sdkOrderCloud, ocCatalog, Parameters, CurrentAssignments) {
                    return sdkOrderCloud.Buyers.List(Parameters)
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
            resolve: {
                Tree: function($stateParams, ocCatalogTree) {
                    return ocCatalogTree.Get($stateParams.catalogid);
                }
            },
            templateUrl: 'catalogManagement/catalog/templates/catalogCategories.html',
            controller: 'CatalogCategoriesCtrl',
            controllerAs:'catalogCategories',
            data: {
                pageTitle: 'Catalog Categories'
            }
        })
        .state('categories.category', {
            url: '/:categoryid',
            templateUrl: 'catalogManagement/catalog/templates/catalogCategory.html',
            controller: 'CatalogCategoryCtrl',
            controllerAs: 'catalogCategory',
            resolve: {
                SelectedCategory: function($stateParams, OrderCloud) {
                    return OrderCloud.Categories.Get($stateParams.categoryid, $stateParams.catalogid);
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
                ProductList: function(OrderCloud, ocCatalog, Parameters, CurrentAssignments) {
                    return OrderCloud.Products.List(Parameters.search, Parameters.page, Parameters.pageSize || 10, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
                        .then(function(data) {
                            return ocCatalog.Products.MapAssignments(CurrentAssignments, data);
                        })
                }
            }
        })
    ;
}