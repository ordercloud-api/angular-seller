angular.module('orderCloud')
    .config(ProductsConfig)
;

function ProductsConfig($stateProvider) {
    $stateProvider
        .state('products', {
            parent: 'base',
            templateUrl: 'productManagement/templates/products.html',
            controller: 'ProductsCtrl',
            controllerAs: 'products',
            url: '/products?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Products'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                ProductList: function(OrderCloud, Parameters) {
                    return OrderCloud.Products.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('products.create', {
            url: '/create',
            templateUrl: 'productManagement/templates/productCreate.html',
            controller: 'ProductCreateCtrl',
            controllerAs: 'productCreate'
        })
        .state('productDetail', {
            parent: 'base',
            url: '/products/:productid',
            templateUrl: 'productManagement/templates/productDetail.html',
            controller: 'ProductDetailCtrl',
            controllerAs: 'productDetail',
            resolve: {
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                }
            }
        })
        .state('productDetail.specs', {
            url: '/specs',
            templateUrl: 'productManagement/templates/productSpecs.html',
            controller: 'ProductSpecsCtrl',
            controllerAs: 'productSpecs',
            resolve: {
                ProductSpecs: function($stateParams, OrderCloud) {
                    return OrderCloud.Specs.ListProductAssignments(null, $stateParams.productid)
                        .then(function(data) {
                            if (data.Items.length) {
                                return OrderCloud.Specs.List(null, null, null, null, null, {ID: _.pluck(data.Items, 'SpecID')})
                                    .then(function(data2) {
                                        data.Items = data2.Items;
                                        return data;
                                    })
                            } else {
                                return data;
                            }
                        });
                }
            }
        })
        .state('productDetail.pricing', {
            url: '/pricing',
            templateUrl: 'productManagement/templates/productPricing.html',
            controller: 'ProductPricingCtrl',
            controllerAs: 'productPricing',
            resolve : {
                AssignmentList: function(ocProductsService, $stateParams, buyerid) {
                    return ocProductsService.AssignmentList($stateParams.productid, buyerid);
                },
                //when we group together the price schedules by the id , it messes with the pagination, I would would have to update the meta data before it resolves , and then translate the results.
                AssignmentData: function (ocProductsService, AssignmentList) {
                    return ocProductsService.AssignmentData(AssignmentList);
                }
            }
        })
        .state('productDetail.shipping', {
            url: '/shipping',
            templateUrl: 'productManagement/templates/productShipping.html'
        })
        .state('products.detail.inventory', {
            url: '/inventory',
            templateUrl: 'productManagement/templates/productInventory.html',
            controller: 'ProductInventoryCtrl',
            controllerAs: 'productInventory',
            resolve: {
                ProductInventory: function($stateParams, OrderCloud) {
                    return OrderCloud.Products.GetInventory($stateParams.productid);
                }
            }
        })
        .state('productDetail.createAssignment', {
            url: '/new-price',
            templateUrl: 'productManagement/templates/productCreateAssignment.html',
            controller: 'ProductCreateAssignmentCtrl',
            controllerAs: 'productCreateAssignment',
            resolve: {
                Buyers: function(OrderCloud){
                    return OrderCloud.Buyers.List();
                }
            }
        })
        .state('productDetail.pricing.priceScheduleDetail', {
            url: '/:pricescheduleid',
            templateUrl: 'productManagement/templates/priceScheduleDetail.html',
            controller: 'PriceScheduleDetailCtrl',
            controllerAs: 'priceScheduleDetail',
            resolve: {
                AssignmentDataDetail: function($stateParams, ocProductsService, AssignmentData) {
                    return ocProductsService.AssignmentDataDetail(AssignmentData, $stateParams.pricescheduleid);
                }
            }
        })
    ;
}