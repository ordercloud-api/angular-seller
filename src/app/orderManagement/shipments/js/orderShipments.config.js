angular.module('orderCloud')
    .config(OrderShipmentsConfig)
;

function OrderShipmentsConfig($stateProvider) {
    $stateProvider
        .state('orderDetail.shipments', {
            url: '/shipments',
            templateUrl: 'orderManagement/shipments/templates/orderShipments.html',
            controller: 'OrderShipmentsCtrl',
            controllerAs: 'orderShipments'
        })
    ;
}