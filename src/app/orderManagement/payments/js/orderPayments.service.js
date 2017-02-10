angular.module('orderCloud')
    .factory('ocOrderPaymentsService', OrderCloudOrderPaymentsService)
;

function OrderCloudOrderPaymentsService($q, OrderCloud) {
    var service = {
        List: _list
    };

    function _list(orderID, buyerID, page, pageSize) {
        var deferred = $q.defer();

        OrderCloud.Payments.List(orderID, null, page || page, pageSize, null, null, null, buyerID)
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
                        OrderCloud.SpendingAccounts.Get(payment.SpendingAccountID, buyerID)
                            .then(function(spendingAccount) {
                                payment.Details = spendingAccount;
                                d.resolve();
                            })
                            .catch(function() {
                                d.resolve();
                            });
                    }
                    else if (payment.Type == 'CreditCard') {
                        OrderCloud.CreditCards.Get(payment.CreditCardID, buyerID)
                            .then(function(creditCard) {
                                payment.Details = creditCard;
                                d.resolve();
                            })
                            .catch(function() {
                                payment.Details = {
                                    CardholderName: 'Kyle Olson',
                                    ExpirationDate: new Date().toISOString(),
                                    CardType: 'Visa',
                                    PartialAccountNumber: '1111'
                                };
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