angular.module('orderCloud')
    .controller('AddressEditModalCtrl', AddressEditModalController)
;

function AddressEditModalController($uibModalInstance, $exceptionHandler, $scope, OrderCloud, OCGeography, SelectedBuyerID) {
    var vm = this,
        addressID = angular.copy(vm.address.ID);
    vm.addressName = angular.copy(vm.address.AddressName);
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function(n, o) {
        if (n && n != o) vm.address.State = null;
    });

    vm.submit = function() {
        vm.loading = OrderCloud.Addresses.Update(addressID, vm.address, SelectedBuyerID)
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