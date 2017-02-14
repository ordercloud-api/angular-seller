angular.module('orderCloud')
    .controller('AddressEditModalCtrl', AddressEditModalController)
;

function AddressEditModalController($uibModalInstance, $exceptionHandler, $scope, OrderCloud, ocGeography, SelectedAddress, SelectedBuyerID) {
    var vm = this;
    vm.address = angular.copy(SelectedAddress);
    vm.addressName = SelectedAddress.AddressName;
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function(n, o) {
        if (n && n != o) vm.address.State = null;
    });

    vm.submit = function() {
        vm.loading = OrderCloud.Addresses.Update(SelectedAddress.ID, vm.address, SelectedBuyerID)
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