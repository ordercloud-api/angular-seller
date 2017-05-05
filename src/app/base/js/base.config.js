angular.module('orderCloud')
    .config(BaseConfig)
;

function BaseConfig($stateProvider) {
    $stateProvider.state('base', {
        url: '',
        abstract: true,
        templateUrl: 'base/templates/base.tpl.html',
        controller: 'BaseCtrl',
        controllerAs: 'base',
        resolve: {
            CurrentUser: function(OrderCloudSDK) {
                return OrderCloudSDK.Me.Get();
            }
        }
    });
}