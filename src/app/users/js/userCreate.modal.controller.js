angular.module('orderCloud')
    .controller('UserCreateModalCtrl', UserCreateModalController)
;

function UserCreateModalController($exceptionHandler, $uibModalInstance, OrderCloud, SelectedBuyerID) {
    var vm = this;
    vm.user = {Email: '', Password: '', Active: false};

    vm.submit = function() {
        vm.user.TermsAccepted = new Date();

        vm.loading = {backdrop:false};
        vm.loading.promise = OrderCloud.Users.Create(vm.user, SelectedBuyerID)
            .then(function(newUser) {
                $uibModalInstance.close(newUser);
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}