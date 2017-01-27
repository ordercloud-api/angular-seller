angular.module('orderCloud')
    .controller('AdminAddressEditModalCtrl', AdminAddressEditModalController)
;

function AdminAddressEditModalController($uibModalInstance, $exceptionHandler, $scope, OrderCloud, OCGeography) {
    var vm = this,
        addressID = angular.copy(vm.adminAddress.ID);
    vm.adminAddressName = angular.copy(vm.adminAddress.AddressName);
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.adminAddress.Country
    }, function(n, o) {
        if (n && n != o) vm.adminAddress.State = null;
    });

    vm.submit = function() {
        OrderCloud.AdminAddresses.Update(addressID, vm.adminAddress)
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