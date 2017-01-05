angular.module('orderCloud')
    .config(CreateUserConfig)
    .controller('UserCreateCtrl', UserCreateController)
;

function CreateUserConfig($stateProvider) {
    $stateProvider
        .state('users.create', {
            url: '/create',
            templateUrl: 'users/createUser/templates/createUser.html',
            controller: 'UserCreateCtrl',
            controllerAs: 'userCreate'
        })
    ;
}

function UserCreateController($exceptionHandler, $state, toastr, OrderCloud) {
    var vm = this;
    vm.user = {Email: '', Password: ''};
    vm.user.Active = false;
    vm.Submit = function() {
        vm.user.TermsAccepted = new Date();
        OrderCloud.Users.Create(vm.user)
            .then(function() {
                $state.go('users', {}, {reload: true});
                toastr.success('User Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}