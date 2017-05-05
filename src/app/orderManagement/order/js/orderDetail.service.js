angular.module('orderCloud')
    .factory('ocOrderDetailService', OrderCloudOrderDetailService)
;

function OrderCloudOrderDetailService($q, $uibModal, $exceptionHandler, OrderCloudSDK) {
    var service = {
        GetOrderDetails: _getOrderDetails,
        EditLineItem: _editLineItem
    };

    function _getOrderDetails(orderID) {
        var deferred = $q.defer();

        OrderCloudSDK.Orders.Get('incoming', orderID)
            .then(function(data) {
                getBuyerCompany(data);
            });

        function getBuyerCompany(data) {
            OrderCloudSDK.Buyers.Get(data.FromCompanyID)
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
                OrderID: function() {
                    return orderID;
                },
                LineItem: function() {
                    return lineItem;
                },
                Product: function() {
                    return OrderCloudSDK.Products.Get(lineItem.ProductID)
                        .then(function(data) {
                            return data;
                        })
                        .catch(function() {
                            return null;
                        });
                }
            }
        }).result;
    }

    return service;
}

