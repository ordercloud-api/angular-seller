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
        .state('products.detail', {
            url: '/:productid/detail?page',
            templateUrl: 'productManagement/templates/productDetail.html',
            controller: 'ProductDetailCtrl',
            controllerAs: 'productDetail',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                },
                AssignmentList: function(ocProductsService, Parameters, buyerid) {
                    return ocProductsService.AssignmentList(Parameters, buyerid);
                },
                //when we group together the price schedules by the id , it messes with the pagination, I would would have to update the meta data before it resolves , and then translate the results.
                AssignmentData: function (ocProductsService, AssignmentList) {
                    return ocProductsService.AssignmentData(AssignmentList);
                }
            }
        })
        .state('products.detail.createAssignment', {
            url: '/assign',
            templateUrl: 'productManagement/templates/productCreateAssignment.html',
            controller: 'ProductCreateAssignmentCtrl',
            controllerAs: 'productCreateAssignment',
            resolve: {
                Buyers: function(OrderCloud){
                    return OrderCloud.Buyers.List();
                }
            }
        })
        .state('products.detail.priceScheduleDetail', {
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