angular.module('orderCloud')
    .controller('AdminAddressEditModalCtrl', AdminAddressEditModalController)
;

function AdminAddressEditModalController($timeout, $uibModalInstance, $exceptionHandler, $scope, OrderCloud, ocGeography, SelectedAddress) {
    var vm = this;

    vm.adminAddress = angular.copy(SelectedAddress);
    vm.adminAddressName = SelectedAddress.AddressName;
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function() {
        return vm.adminAddress.Country
    }, function(n, o) {
        if (n && n != o) {
            vm.adminAddress.State = null;
            $timeout(function() {
                vm.form.State.$$element.focus();
            }, 100);
        }
    });

    vm.submit = function() {
        OrderCloud.AdminAddresses.Update(SelectedAddress.ID, vm.adminAddress)
            .then(function(updatedAddress) {
                $uibModalInstance.close(updatedAddress);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}