angular.module('orderCloud')
    .config(UserGroupsConfig)
;

function UserGroupsConfig($stateProvider) {
    $stateProvider
        .state('userGroups', {
            parent: 'buyer',
            url: '/user-groups?search&page&pageSize&searchOn&sortBy&filters',
            templateUrl: 'buyerManagement/userGroups/templates/userGroups.html',
            controller: 'UserGroupsCtrl',
            controllerAs: 'userGroups',
            data: {
                pageTitle: 'Buyer User Groups'
            },
            resolve: {
                Parameters: function($stateParams, ocParameters) {
                    return ocParameters.Get($stateParams);
                },
                UserGroupList: function($stateParams, sdkOrderCloud, Parameters) {
                    return sdkOrderCloud.UserGroups.List($stateParams.buyerid, Parameters);
                }
            }
        })
        .state('userGroup', {
            parent: 'buyer',
            url: '/user-groups/:usergroupid',
            templateUrl: 'buyerManagement/userGroups/templates/userGroup.html',
            controller: 'UserGroupCtrl',
            controllerAs: 'userGroup',
            data: {
                pageTitle: 'Buyer User Group'
            },
            resolve: {
                SelectedUserGroup: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.UserGroups.Get($stateParams.buyerid, $stateParams.usergroupid);
                }
            }
        })
    ;
}