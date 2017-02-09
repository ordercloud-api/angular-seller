angular.module('orderCloud')
    .factory('ocOrderDetailService', OrderCloudOrderDetailService)
;

function OrderCloudOrderDetailService($q, $uibModal, $exceptionHandler, OrderCloud) {
    var service = {
        GetOrderDetails: _getOrderDetails,
        EditLineItem: _editLineItem
    };

    function _getOrderDetails(orderID, buyerID) {
        var deferred = $q.defer();

        OrderCloud.Orders.Get(orderID, buyerID)
            .then(function(data) {
                getBuyerCompany(data);
            });

        function getBuyerCompany(data) {
            OrderCloud.Buyers.Get(data.FromCompanyID)
                .then(function(buyer) {
                    data.FromCompany = buyer;
                    deferred.resolve(data);
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                    deferred.resolve(data);
                });
        }

        return deferred.promise;
    }

    function _editLineItem(buyerID, orderID, lineItem) {
        return $uibModal.open({
            templateUrl: 'orderManagement/order/templates/orderDetail.lineItemEdit.modal.html',
            controller: 'OrderLineItemEditModalCtrl',
            controllerAs: 'orderLineItemEditModal',
            size: 'md',
            resolve: {
                BuyerID: function() {
                    return buyerID;
                },
                OrderID: function() {
                    return orderID;
                },
                LineItem: function() {
                    return lineItem;
                }
            }
        }).result;
    }

    return service;
}

