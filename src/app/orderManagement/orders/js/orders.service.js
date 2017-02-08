angular.module('orderCloud')
    .factory('ocOrdersService', OrderCloudOrdersService)
;

function OrderCloudOrdersService($q, $filter, OrderCloud) {
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

        var showSubmittedOnly = angular.extend({status: '!Unsubmitted'}, parameters.filters);

        OrderCloud.Orders.ListIncoming(null, null, parameters.search, parameters.page, parameters.pageSize, parameters.searchOn, parameters.sortBy, showSubmittedOnly, parameters.buyerID)
            .then(function(data) {
                gatherBuyers(data);
            });

        function gatherBuyers(data) {
            var buyerIDs = _.uniq(_.pluck(data.Items, 'FromCompanyID'));
            OrderCloud.Buyers.List(null, 1, 100, null, null, {ID: buyerIDs.join('|')})
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