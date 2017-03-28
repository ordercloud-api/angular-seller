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
            CurrentUser: function($q, $state, sdkOrderCloud, LoginService) {
                return sdkOrderCloud.Me.Get()
                    .catch(function(){
                        LoginService.Logout();
                    });
            }
        }
    });
}