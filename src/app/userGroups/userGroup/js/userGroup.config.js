angular.module('orderCloud')
    .config(UserGroupConfig)
;

function UserGroupConfig($stateProvider) {
    $stateProvider
        .state('userGroup', {
            parent: 'buyer',
            url: '/user-groups/:usergroupid',
            templateUrl: 'userGroups/userGroup/templates/userGroup.html',
            controller: 'UserGroupCtrl',
            controllerAs: 'userGroup',
            resolve: {
                SelectedUserGroup: function($stateParams, OrderCloud) {
                    return OrderCloud.UserGroups.Get($stateParams.usergroupid, $stateParams.buyerid);
                }
            }
        })
    ;
}