angular.module('orderCloud')
    .factory('ocOrdersService', OrderCloudOrdersService)
;

function OrderCloudOrdersService($q, $filter, OrderCloudSDK) {
    var service = {
        List: _list
    };
    
    function _list(parameters) {
        var deferred = $q.defer();

        function convertToDate(toDate) {
            var result = new Date(toDate);
            result = result.setDate(result.getDate() + 1);
            return $filter('date')(result, 'MM-dd-yyyy');
        }

        if (parameters.fromDate && parameters.toDate) {
            parameters.filters.DateSubmitted = [('>' + parameters.fromDate), ('<' + convertToDate(parameters.toDate))];
        } else if(parameters.fromDate && !parameters.toDate) {
            parameters.filters.DateSubmitted = [('>' + parameters.fromDate)];
        } else if (!parameters.fromDate && parameters.toDate) {
            parameters.filters.DateSubmitted = [('<' + convertToDate(parameters.toDate))];
        }

        //TODO: uncomment when ! operator is fixed in API EX-1166
        //angular.extend(parameters.filters, {status: '!Unsubmitted'});

        OrderCloudSDK.Orders.List('incoming', parameters)
            .then(function(data) {
                gatherBuyerCompanies(data);
            });

        function gatherBuyerCompanies(data) {
            var buyerIDs = _.uniq(_.pluck(data.Items, 'FromCompanyID'));
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: buyerIDs.join('|')}
            };
            OrderCloudSDK.Buyers.List(options)
                .then(function(buyerData) {
                    _.map(data.Items, function(order) {
                        order.FromCompany = _.findWhere(buyerData.Items, {ID: order.FromCompanyID});
                    });
                    deferred.resolve(data);
                });
        }
        
        return deferred.promise;
    }
    
    return service;
}