angular.module('orderCloud')
    .factory('ocAuthNet', AuthorizeNet)
;

function AuthorizeNet($q, $resource, OrderCloud, apiurl, ocCreditCardUtility) {
    var service = {
        CreateCreditCard: _createCreateCard,
        UpdateCreditCard: _updateCreditCard,
        DeleteCreditCard: _deleteCreditCard
    };

    function _createCreateCard(creditCard, buyerID) {
        var ExpirationDate = ocCreditCardUtility.ExpirationDateFormat(creditCard.ExpirationMonth, creditCard.ExpirationYear);
        return _makeApiCall('POST', {
            BuyerID: buyerID ? buyerID : OrderCloud.BuyerID.Get(),
            TransactionType: 'createCreditCard',
            CardDetails: {
                CreditCardID: creditCard.ID,
                CardholderName: creditCard.CardholderName,
                CardType: creditCard.CardType,
                CardNumber: creditCard.CardNumber,
                ExpirationDate: ExpirationDate,
                CardCode: creditCard.CardCode,
                Shared: creditCard.Shared
            }
        });
    }

    function _updateCreditCard(creditCard, buyerID) {
        var ExpirationDate = ocCreditCardUtility.ExpirationDateFormat(creditCard.ExpirationMonth, creditCard.ExpirationYear);
        return _makeApiCall('POST', {
            BuyerID: buyerID ? buyerID : OrderCloud.BuyerID.Get(),
            TransactionType: 'updateCreditCard',
            CardDetails: {
                UpdatedCreditCardID: creditCard.UpdatedCreditCardID,
                CreditCardID: creditCard.ID,
                CardholderName: creditCard.CardholderName,
                CardType: creditCard.CardType,
                CardNumber: 'XXXX'+ creditCard.PartialAccountNumber,
                ExpirationDate: ExpirationDate,
                Shared: creditCard.Shared
            }
        });

    }
    function _deleteCreditCard(creditCard, buyerID) {
        return _makeApiCall('POST', {
            BuyerID: buyerID ? buyerID : OrderCloud.BuyerID.Get(),
            TransactionType: 'deleteCreditCard',
            CardDetails: {
                CreditCardID: creditCard.ID,
                Shared: creditCard.Shared
            }
        });
    }

    function _makeApiCall(method, requestBody) {
        var apiUrl = apiurl +'/v1/integrationproxy/authorizenet';
        var d = $q.defer();
        $resource(apiUrl, null, {
            callApi: {
                method: method,
                headers: {
                    'Authorization': 'Bearer ' + OrderCloud.Auth.ReadToken()
                }
            }
        }).callApi(requestBody).$promise
            .then(function(data) {
                d.resolve(data.ResponseBody.Result ? data.ResponseBody.Result : data.ResponseBody);
            })
            .catch(function(ex) {
                d.reject(ex);
            });
        return d.promise;
    }

    return service;
}