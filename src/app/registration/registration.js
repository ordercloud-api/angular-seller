angular.module('orderCloud')
    .config(RegistrationConfig)
    .controller('RegistrationCtrl', RegistrationController)
;

function RegistrationConfig($stateProvider) {
    $stateProvider
        .state('registration', {
            parent: 'base',
            url: '/registration',
            templateUrl: 'registration/templates/registration.tpl.html',
            controller: 'RegistrationCtrl',
            controllerAs: 'registration',
            data: {componentName: 'Registration'}
        })
    ;
}

function RegistrationController($state, $stateParams, $exceptionHandler, toastr, OrderCloud, LoginService) {
    var vm = this;
    vm.user = {Active: true};
    vm.credentials = {
        Username: null,
        Password: null
    };
    vm.token = $stateParams.token;
    vm.form = vm.token ? 'reset' : 'login';
    vm.loginFormHeaders = {
        'login': 'Login',
        'forgot': 'Forgot Password',
        'verificationCodeSuccess': 'Forgot Password',
        'reset': 'Reset Password',
        'resetSuccess': 'Reset Password'
    };
    vm.setForm = function(form) {
        vm.form = form;
    };

    vm.register = function() {
        vm.user.TermsAccepted = new Date();
        OrderCloud.Me.CreateFromTempUser(vm.user, OrderCloud.Auth.ReadToken())
            .then(function(token) {
                OrderCloud.Auth.SetToken(token.access_token);
                $state.go('home', {}, {reload: true});
                toastr.success('Registration Successful', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.login = function() {
        var tempUserToken = angular.copy(OrderCloud.Auth.ReadToken());
        OrderCloud.Auth.GetToken(vm.credentials)
            .then(function(data) {
                OrderCloud.Auth.SetToken(data['access_token']);
                OrderCloud.Orders.TransferTempUserOrder(tempUserToken)
                    .then(function(data) {
                        console.log(data);
                    })
                    .finally(function() {
                        $state.go('home', {}, {reload: true});
                    });
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.forgotPassword = function() {
        LoginService.SendVerificationCode(vm.credentials.Email)
            .then(function() {
                vm.setForm('verificationCodeSuccess');
                vm.credentials.Email = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.resetPassword = function() {
        LoginService.ResetPassword(vm.credentials, vm.token)
            .then(function() {
                vm.setForm('resetSuccess');
                vm.token = null;
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            });
    };
}