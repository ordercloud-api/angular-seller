angular.module('orderCloud')
    .config(OrderShipmentsConfig)
;

function OrderShipmentsConfig($stateProvider) {
    $stateProvider
        .state('orderDetail.shipments', {
            url: '/shipments',
            templateUrl: 'orderManagement/shipments/templates/orderShipments.html',
            controller: 'OrderShipmentsCtrl',
            controllerAs: 'orderShipments',
            data: {
                pageTitle: 'Order Shipments'
            },
            resolve: {
                OrderShipments: function($stateParams, ocOrderShipmentsService) {
                    return ocOrderShipmentsService.List($stateParams.orderid, $stateParams.buyerid);
                }
            }
        })
        .state('orderDetail.shipments.create', {
            url: '/create',
            templateUrl: 'orderManagement/shipments/templates/orderShipmentsCreate.html',
            controller: 'OrderShipmentsCreateCtrl',
            controllerAs: 'orderShipmentsCreate',
            data: {
                pageTitle: 'Create Shipment'
            },
            resolve: {
                ShipmentLineItems: function($stateParams, ocOrderShipmentsService) {
                    return ocOrderShipmentsService.ListLineItems($stateParams.orderid, $stateParams.buyerid);
                }
            }
        })
    ;
}