angular.module('orderCloud')
    .factory('ocOrderPaymentsService', OrderCloudOrderPaymentsService)
;

function OrderCloudOrderPaymentsService($q, OrderCloudSDK) {
    var service = {
        List: _list
    };

    function _list(orderID, buyerID, page, pageSize) {
        var deferred = $q.defer();

        var options = {
            page: page,
            pageSize: pageSize
        };
        OrderCloudSDK.Payments.List('incoming', orderID, options)
            .then(function(data) {
                getPaymentDetails(data);
            });

        function getPaymentDetails(data) {
            var queue = [];
            angular.forEach(data.Items, function(payment) {
                queue.push((function() {
                    var d = $q.defer();

                    payment.Details = null;

                    if (payment.Type == 'SpendingAccount') {
                        OrderCloudSDK.SpendingAccounts.Get(buyerID, payment.SpendingAccountID)
                            .then(function(spendingAccount) {
                                payment.Details = spendingAccount;
                                d.resolve();
                            })
                            .catch(function() {
                                d.resolve();
                            });
                    }
                    else if (payment.Type == 'CreditCard') {
                        OrderCloudSDK.CreditCards.Get(buyerID, payment.CreditCardID)
                            .then(function(creditCard) {
                                payment.Details = creditCard;
                                d.resolve();
                            })
                            .catch(function() {
                                d.resolve();
                            });
                    }
                    else if (payment.Type == 'PurchaseOrder') {
                        if (payment.xp && payment.xp.PONumber) {
                            payment.Details = {
                                PONumber: payment.xp.PONumber
                            };
                        }
                        d.resolve();
                    }
                    else {
                        d.resolve();
                    }

                    return d.promise;
                })());
            });

            deferred.resolve(data);
        }

        return deferred.promise;
    }

    return service;
}