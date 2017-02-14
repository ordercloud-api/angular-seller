angular.module('orderCloud')
    .config(UserGroupCostCentersConfig)
;

function UserGroupCostCentersConfig($stateProvider) {
    $stateProvider
        .state('userGroup.costCenters', {
            templateUrl: 'costCenters/templates/costCenters.html',
            controller: 'CostCentersCtrl',
            controllerAs: 'costCenters',
            url: '/costcenters?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Cost Centers'},
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