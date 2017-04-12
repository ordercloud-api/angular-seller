angular.module('orderCloud')
    .config(SellerUserGroupsConfig)
;

function SellerUserGroupsConfig($stateProvider) {
    $stateProvider
        .state('sellerUserGroups', {
            parent: 'base',
            templateUrl: 'sellerUserGroups/templates/sellerUserGroups.html',
            controller: 'SellerUserGroupsCtrl',
            controllerAs: 'sellerUserGroups',
            url: '/seller-user-groups?search&page&pageSize&sortBy&searchOn&filters',
            data: {
                pageTitle: 'Seller User Groups'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                SellerUserGroupList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.AdminUserGroups.List(Parameters);
                }
            }
        })
        .state('sellerUserGroup', {
            parent: 'base',
            url: '/seller-user-groups/:sellerusergroupid',
            templateUrl: 'sellerUserGroups/templates/sellerUserGroup.html',
            controller: 'SellerUserGroupCtrl',
            controllerAs: 'sellerUserGroup',
            data: {
                pageTitle: 'Seller User Group'
            },
            resolve: {
                SelectedSellerUserGroup: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.AdminUserGroups.Get($stateParams.sellerusergroupid);
                }
            }
        })
    ;
}