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

function UserCreateController($exceptionHandler, $uibModalInstance, $state, toastr, OrderCloud) {
    var vm = this;
    vm.user = {Email: '', Password: '', Active: false};

    vm.Submit = function() {
        vm.user.TermsAccepted = new Date();

        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.Users.Create(vm.user)
            .then(function(data) {
                $uibModalInstance.close(data);
                toastr.success('User Created', 'Success');
                $state.go('users', {}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Cancel = function() {
        $uibModalInstance.dismiss();
    }
}