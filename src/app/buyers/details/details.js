angular.module('orderCloud')
    .config(BuyerDetailsConfig)
    .controller('BuyerDetailsCtrl', BuyerDetailsController)
;

function BuyerDetailsConfig($stateProvider) {
    $stateProvider
        .state('buyers.details', {
                url: '/:buyerid/details',
                templateUrl: 'buyers/details/templates/details.html',
                controller: 'BuyerDetailsCtrl',
                controllerAs: 'buyerDetails',
                resolve: {
                    SelectedBuyer: function ($stateParams, OrderCloud) {
                        return OrderCloud.Buyers.Get($stateParams.buyerid);
                    }
                }
            })
}

function BuyerDetailsController(SelectedBuyer){
    var vm = this;
    vm.selectedBuyer = SelectedBuyer;
}