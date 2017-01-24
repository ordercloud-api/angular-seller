angular.module('orderCloud')
    .config(ProductPricingConfig)
;

function ProductPricingConfig($stateProvider) {
    $stateProvider
        .state('productDetail.pricing', {
            url: '/pricing',
            params: {
                pricescheduleid: undefined
            },
            templateUrl: 'productManagement/productPricing/templates/productPricing.html',
            controller: 'ProductPricingCtrl',
            controllerAs: 'productPricing',
            resolve : {
                AssignmentList: function(ocProductPricing, $stateParams, buyerid) {
                    return ocProductPricing.AssignmentList($stateParams.productid, buyerid);
                },
                //when we group together the price schedules by the id , it messes with the pagination, I would would have to update the meta data before it resolves , and then translate the results.
                AssignmentData: function (ocProductPricing, AssignmentList) {
                    return ocProductPricing.AssignmentData(AssignmentList);
                }
            }
        })
        .state('productDetail.createAssignment', {
            url: '/new-price',
            templateUrl: 'productManagement/productPricing/templates/productCreateAssignment.html',
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
            templateUrl: 'productManagement/productPricing/templates/priceScheduleDetail.html',
            controller: 'PriceScheduleDetailCtrl',
            controllerAs: 'priceScheduleDetail',
            resolve: {
                AssignmentDataDetail: function($stateParams, ocProductPricing, AssignmentData) {
                    return ocProductPricing.AssignmentDataDetail(AssignmentData, $stateParams.pricescheduleid);
                }
            }
        })
    ;
}