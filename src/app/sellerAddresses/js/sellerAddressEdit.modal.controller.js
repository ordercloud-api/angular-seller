angular.module('orderCloud')
    .controller('SellerAddressEditModalCtrl', SellerAddressEditModalController)
;

function SellerAddressEditModalController($timeout, $uibModalInstance, $exceptionHandler, $scope, OrderCloudSDK, ocGeography, SelectedAddress) {
    var vm = this;

    vm.sellerAddress = angular.copy(SelectedAddress);
    vm.sellerAddressName = SelectedAddress.AddressName;
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function() {
        return vm.sellerAddress.Country;
    }, function(n, o) {
        if (n && n != o) {
            vm.sellerAddress.State = null;
            $timeout(function() {
                vm.form.State.$$element.focus();
            }, 100);
        }
    });

    vm.submit = function() {
        vm.loading = OrderCloudSDK.AdminAddresses.Update(SelectedAddress.ID, vm.sellerAddress)
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