angular.module('orderCloud')
    .config(PromotionsConfig)
;

function PromotionsConfig($stateProvider) {
    $stateProvider
        .state('promotions', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/promotions/templates/promotions.html',
            controller: 'PromotionsCtrl',
            controllerAs: 'promotions',
            url: '/promotions?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Promotions'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocPromotions, $stateParams) {
                    return ocPromotions.Assignments.Get('company', $stateParams.buyerid);
                },
                PromotionList: function(OrderCloudSDK, Parameters, CurrentAssignments, ocPromotions) {
                    return OrderCloudSDK.Promotions.List(Parameters)
                        .then(function(data) {
                            return ocPromotions.Assignments.Map(CurrentAssignments, data, Parameters.buyerid);
                        });
                }
            }
        })
        .state('userGroup.promotions', {
            templateUrl: 'buyerManagement/promotions/templates/promotions.html',
            controller: 'PromotionsCtrl',
            controllerAs: 'promotions',
            url: '/promotions?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'User Group Promotions'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocPromotions, $stateParams) {
                    return ocPromotions.Assignments.Get('group', $stateParams.buyerid, $stateParams.usergroupid);
                },
                PromotionList: function(OrderCloudSDK, Parameters, CurrentAssignments, ocPromotions) {
                    return OrderCloudSDK.Promotions.List(Parameters)
                        .then(function(data) {
                            return ocPromotions.Assignments.Map(CurrentAssignments, data, Parameters.buyerid);
                        });
                }
            }
        })
    ;
}