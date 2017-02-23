angular.module('orderCloud')
    .config(CostCentersConfig)
;

function CostCentersConfig($stateProvider) {
    $stateProvider
        .state('costCenters', {
            parent: 'buyer',
            templateUrl: 'buyerManagement/costCenters/templates/costCenters.html',
            controller: 'CostCentersCtrl',
            controllerAs: 'costCenters',
            url: '/costcenters?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'Buyer Cost Centers'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocCostCenters, $stateParams) {
                    return ocCostCenters.Assignments.Get('company', $stateParams.buyerid);
                },
                CostCentersList: function(OrderCloud, ocCostCenters, Parameters, CurrentAssignments) {
                    return OrderCloud.CostCenters.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            return ocCostCenters.Assignments.Map(CurrentAssignments, data);
                        })
                }
            }
        })
        .state('userGroup.costCenters', {
            templateUrl: 'buyerManagement/costCenters/templates/costCenters.html',
            controller: 'CostCentersCtrl',
            controllerAs: 'costCenters',
            url: '/costcenters?search&page&pageSize&searchOn&sortBy&filters',
            data: {
                pageTitle: 'User Group Cost Centers'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                CurrentAssignments: function($q, ocCostCenters, $stateParams) {
                    return ocCostCenters.Assignments.Get('group', $stateParams.buyerid, $stateParams.usergroupid);
                },
                CostCentersList: function(OrderCloud, ocCostCenters, Parameters, CurrentAssignments) {
                    return OrderCloud.CostCenters.List(Parameters.search, Parameters.page, Parameters.pageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters, Parameters.buyerid)
                        .then(function(data) {
                            return ocCostCenters.Assignments.Map(CurrentAssignments, data);
                        })
                }
            }
        })
    ;
}