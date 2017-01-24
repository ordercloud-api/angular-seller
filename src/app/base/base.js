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

function BaseController(defaultErrorMessageResolver, CurrentUser) {
    var vm = this;
    vm.currentUser = CurrentUser;

    defaultErrorMessageResolver.getErrorMessages().then(function (errorMessages) {
        errorMessages['customPassword'] = 'Password must be at least eight characters long and include at least one letter and one number';
        //regex for customPassword = ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*?&]{8,}$
        errorMessages['positiveInteger'] = 'Please enter a positive integer';
        //regex positiveInteger = ^[0-9]*[1-9][0-9]*$
        errorMessages['ID_Name'] = 'Only Alphanumeric characters, hyphens and underscores are allowed';
        //regex ID_Name = ([A-Za-z0-9\-\_]+)
        errorMessages['confirmpassword'] = 'Your passwords do not match';
        errorMessages['noSpecialChars'] = 'Only Alphanumeric characters are allowed';
    });
}