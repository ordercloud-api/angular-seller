angular.module('orderCloud')
    .config(BaseConfig)
    .controller('BaseCtrl', BaseController)
;

function BaseConfig($stateProvider) {
    $stateProvider.state('base', {
        url: '',
        abstract: true,
        templateUrl: 'base/templates/base.tpl.html',
        controller: 'BaseCtrl',
        controllerAs: 'base',
        resolve: {
            CurrentUser: function($q, $state, OrderCloud, LoginService) {
                return OrderCloud.Me.Get()
                    .catch(function(){
                        LoginService.Logout();
                    });
            }
        }
    });
}

function BaseController(CurrentUser) {
    var vm = this;
    vm.currentUser = CurrentUser;
}