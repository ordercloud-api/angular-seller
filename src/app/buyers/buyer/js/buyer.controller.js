angular.module('orderCloud')
    .controller('BuyerCtrl', BuyerController)
;

function BuyerController($state, $exceptionHandler, toastr, OrderCloud, ocBuyers, SelectedBuyer, ocConfirm){
    var vm = this;
    vm.selectedBuyer = SelectedBuyer;
    vm.settings = angular.copy(SelectedBuyer);

    vm.updateValidity = function() {
        if (vm.settingsForm.buyerIDinput.$error['Buyer.UnavailableID']) vm.settingsForm.buyerIDinput.$setValidity('Buyer.UnavailableID', true);
    };

    vm.updateBuyer = function() {
        vm.updateLoading = OrderCloud.Buyers.Update(vm.settings, SelectedBuyer.ID)
            .then(function(data) {
                vm.selectedBuyer = data;
                vm.settings = angular.copy(data);
                toastr.success('Buyer Settings Updated', 'Success');
                vm.settingsForm.$setPristine();
            })
            .catch(function(ex) {
                if (ex.status == 409) {
                    vm.settingsForm.buyerIDinput.$setValidity(ex.data.Errors[0].ErrorCode, false);
                    vm.settingsForm.buyerIDinput.$$element[0].focus();
                } else {
                    $exceptionHandler(ex);
                }
            });
    };

    vm.deleteBuyer = function() {
        ocConfirm.Confirm({
                message: "Are you sure you want to delete this buyer organization and all of its related data?  <b>This action cannot be undone.</b>"
            })
            .then(function() {
                OrderCloud.Buyers.Delete(vm.selectedBuyer.ID)
                    .then(function() {
                        toastr.success(vm.selectedBuyer.Name + ' was deleted.', 'Success!');
                        $state.go('buyers');
                    })
            })
    };

    vm.createBuyer = function() {
        ocBuyers.Create()
            .then(function(data) {
                toastr.success(data.Name + ' was created.', 'Success!');
                $state.go('buyer.settings', {buyerid: data.ID});
            })
    }
}