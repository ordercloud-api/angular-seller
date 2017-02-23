angular.module('orderCloud')
    .controller('AddressCreateModalCtrl', AddressCreateModalController)
;

function AddressCreateModalController($timeout, $uibModalInstance, $exceptionHandler, $scope, OrderCloud, ocGeography, SelectedBuyerID){
    var vm = this;
    vm.address = {
        Country: 'US' // this is to default 'create' addresses to the country US
    };
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function(n, o) {
        if (n && n != o) vm.address.State = null;
        $timeout(function() {
            vm.form.State.$$element.focus();
        }, 100);
    });

    vm.submit = function() {
        vm.loading = OrderCloud.Addresses.Create(vm.address, SelectedBuyerID)
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