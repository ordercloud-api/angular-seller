angular.module('orderCloud')
    .controller('SellerAddressCreateModalCtrl', SellerAddressCreateModalController);

function SellerAddressCreateModalController($timeout, $uibModalInstance, $exceptionHandler, $scope, OrderCloudSDK, ocGeography) {
    var vm = this;
    vm.sellerAddress = {
        Country: 'US' // this is to default 'create' addresses to the country US
    };
    vm.countries = ocGeography.Countries;
    vm.states = ocGeography.States;

    $scope.$watch(function () {
        return vm.sellerAddress.Country;
    }, function (n, o) {
        if (n && n != o) {
            vm.sellerAddress.State = null;
            $timeout(function () {
                vm.form.State.$$element.focus();
            }, 100);
        }
    });

    vm.submit = function () {
        vm.loading = OrderCloudSDK.AdminAddresses.Create(vm.sellerAddress)
            .then(function (newAddress) {
                $uibModalInstance.close(newAddress);
            })
            .catch(function (ex) {
                $exceptionHandler(ex);
            });
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss();
    };
}