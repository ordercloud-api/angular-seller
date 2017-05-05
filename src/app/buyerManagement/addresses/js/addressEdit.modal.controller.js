angular.module('orderCloud')
    .controller('AddressEditModalCtrl', AddressEditModalController)
;

function AddressEditModalController($timeout, $uibModalInstance, $exceptionHandler, $scope, OrderCloudSDK, ocGeography, SelectedAddress, SelectedBuyerID) {
    var vm = this;
    vm.address = angular.copy(SelectedAddress);
    vm.addressName = SelectedAddress.AddressName;
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function() {
        return vm.address.Country;
    }, function(n, o) {
        if (n && n != o) {
            vm.address.State = null;
            $timeout(function() {
                vm.form.State.$$element.focus();
            }, 100);
        }
    });

    vm.submit = function() {
        vm.loading = OrderCloudSDK.Addresses.Update(SelectedBuyerID, SelectedAddress.ID, vm.address)
            .then(function(updatedAddress) {
                $uibModalInstance.close(updatedAddress);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}