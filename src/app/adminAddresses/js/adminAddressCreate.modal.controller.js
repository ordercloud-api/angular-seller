angular.module('orderCloud')
    .controller('AdminAddressCreateModalCtrl', AdminAddressCreateModalController)
;

function AdminAddressCreateModalController($uibModalInstance, $exceptionHandler, $scope, OrderCloud, ocGeography){
    var vm = this;
    vm.adminAddress = {
        Country: 'US' // this is to default 'create' addresses to the country US
    };
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function() {
        return vm.adminAddress.Country
    }, function() {
        vm.adminAddress.State = null;
    });

    vm.submit = function() {
        vm.loading = OrderCloud.AdminAddresses.Create(vm.adminAddress)
            .then(function(newAddress) {
                $uibModalInstance.close(newAddress);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            })
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}