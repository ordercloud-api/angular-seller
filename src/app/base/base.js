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
            CurrentUser: function($q, $state, OrderCloud) {
                var dfd = $q.defer();
                OrderCloud.Me.Get()
                    .then(function(data) {
                        dfd.resolve(data);
                    })
                    .catch(function(){
                        OrderCloud.Auth.RemoveToken();
                        OrderCloud.Auth.RemoveImpersonationToken();
                        OrderCloud.BuyerID.Set(null);
                        $state.go('login');
                        dfd.resolve();
                    });
                return dfd.promise;
            }
        }
    });
}

function BaseController(CurrentUser) {
    var vm = this;
    vm.currentUser = CurrentUser;
}