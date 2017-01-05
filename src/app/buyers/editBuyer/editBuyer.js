angular.module('orderCloud')
    .config(EditBuyerConfig)
    .controller('BuyerEditCtrl', BuyerEditController)
;

function EditBuyerConfig($stateProvider) {
    $stateProvider
        .state('buyers.edit', {
            url: '/:buyerid/edit',
            templateUrl: 'buyers/editBuyer/templates/editBuyer.html',
            controller: 'BuyerEditCtrl',
            controllerAs: 'buyerEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud) {
                    return OrderCloud.Buyers.Get($stateParams.buyerid);
                }
            }
        })
}

function BuyerEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedBuyer) {
    var vm = this;
    vm.buyer = SelectedBuyer;
    vm.buyerName = SelectedBuyer.Name;

    vm.Submit = function() {
        OrderCloud.Buyers.Update(vm.buyer, SelectedBuyer.ID)
            .then(function() {
                $state.go('buyers', {}, {reload: true});
                toastr.success('Buyer Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}