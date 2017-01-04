angular.module('orderCloud')
    .config(BuyerCreateConfig)
    .controller('BuyerCreateCtrl', BuyerCreateController)
;

function BuyerCreateConfig($stateProvider) {
    $stateProvider

        .state('buyers.create', {
            url: '/create',
            templateUrl: 'buyers/createBuyer/templates/createBuyer.html',
            controller: 'BuyerCreateCtrl',
            controllerAs: 'buyerCreate'
        })
}

function BuyerCreateController($exceptionHandler, $state, toastr, OrderCloud) {
    var vm = this;
    vm.submit = submit;

    function submit() {
        OrderCloud.Buyers.Create(vm.buyer)
            .then(function() {
                $state.go('buyers', {}, {reload: true});
                toastr.success('Buyer Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}