angular.module('orderCloud')
    .controller('AdminAddressEditModalCtrl', AdminAddressEditModalController)
;

function AdminAddressEditModalController($uibModalInstance, $exceptionHandler, $scope, OrderCloud, OCGeography, SelectedAddress) {
    var vm = this;

    vm.adminAddress = angular.copy(SelectedAddress);
    vm.adminAddressName = SelectedAddress.AddressName;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.adminAddress.Country
    }, function(n, o) {
        if (n && n != o) vm.adminAddress.State = null;
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