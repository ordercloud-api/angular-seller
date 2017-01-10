angular.module('orderCloud')
    .config(BuyerDetailsConfig)
    .controller('BuyerDetailsCtrl', BuyerDetailsController)
;

function BuyerDetailsConfig($stateProvider) {
    $stateProvider
        .state('buyers.details', {
                url: '/:buyerid/details?search&page&pageSize&searchOn&sortBy',
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

function BuyerDetailsController($state, SelectedBuyer){
    var vm = this;
    vm.state = $state;
    vm.selectedBuyer = SelectedBuyer;
}