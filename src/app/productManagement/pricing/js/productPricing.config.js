angular.module('orderCloud')
    .config(ProductPricingConfig)
;

function ProductPricingConfig($stateProvider) {
    $stateProvider
        .state('product.pricing', {
            url: '/pricing',
            params: {
                pricescheduleid: undefined
            },
            templateUrl: 'productManagement/pricing/templates/productPricing.html',
            controller: 'ProductPricingCtrl',
            controllerAs: 'productPricing',
            data: {
                pageTitle: 'Product Pricing'
            },
            resolve : {
                AssignmentList: function(ocProductPricing, $stateParams, SelectedProduct) {
                    return ocProductPricing.AssignmentList($stateParams.productid)
                        .then(function(data) {
                            if (!SelectedProduct.DefaultPriceScheduleID) {
                                return data;
                            } else {
                                data.Items.push({ProductID: SelectedProduct.ID, PriceScheduleID: SelectedProduct.DefaultPriceScheduleID});
                                return data;
                            }
                        });
                },
                //when we group together the price schedules by the id , it messes with the pagination, I would would have to update the meta data before it resolves , and then translate the results.
                AssignmentData: function (ocProductPricing, AssignmentList) {
                    return ocProductPricing.AssignmentData(AssignmentList);
                }
            }
        })
        .state('product.pricing.priceScheduleDetail', {
            url: '/:pricescheduleid',
            templateUrl: 'productManagement/pricing/templates/priceScheduleDetail.html',
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