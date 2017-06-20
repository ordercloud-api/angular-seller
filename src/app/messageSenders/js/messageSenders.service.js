angular.module('orderCloud')
    .factory('ocMessageSenders', OrderCloudMessageSendersService)
;

function OrderCloudMessageSendersService(OrderCloudSDK) {
    var service = {
        List: _list,
        Assignments: {
            MapSeller: _mapSeller,
            MapSellerGroup: _mapSellerGroup,
            MapBuyer: _mapBuyer,
            MapBuyerGroup: _mapBuyerGroup
        }
    };

    function _list(parameters) {
        return OrderCloudSDK.MessageSenders.List()
            .then(function(data) {
                if (parameters.buyerid && parameters.usergroupid && !parameters.sellerusergroupid) {
                    return service.Assignments.MapBuyerGroup(data, parameters.buyerid, parameters.usergroupid);
                } else if (!parameters.buyerid && !parameters.usergroupid && parameters.sellerusergroupid) {
                    return service.Assignments.MapSellerGroup(data, parameters.sellerusergroupid);
                } else if (parameters.buyerid && !parameters.usergroupid) {
                    return service.Assignments.MapBuyer(data, parameters.buyerid);
                } else {
                    return service.Assignments.MapSeller(data);
                }
            });
    }

    function _mapSeller(availableMessageSenders) {
        //TODO: Known issue, commerceRole is not supported by message senders assignments listing so the results from this service will seem inaccurate (all buyer assignments will come through as seller assignments)
        return OrderCloudSDK.MessageSenders.ListAssignments({level:'company', pageSize:100, commerceRole:'seller'})
                    .then(function(assignments) {
                        return _.map(availableMessageSenders.Items, function(ms) {
                            ms.selected = _.map(assignments.Items, 'MessageSenderID').indexOf(ms.ID) > -1;
                            return ms;
                        });
                    });
    }

    function _mapSellerGroup(availableMessageSenders, userGroupID) {
        return OrderCloudSDK.MessageSenders.ListAssignments({level:'group', pageSize:100, userGroupID:userGroupID, commerceRole:'seller'})
                    .then(function(assignments) {
                        return _.map(availableMessageSenders.Items, function(ms) {
                            ms.selected = _.map(assignments.Items, 'MessageSenderID').indexOf(ms.ID) > -1;
                            return ms;
                        });
                    });
    }

    function _mapBuyer(availableMessageSenders, buyerID) {
        return OrderCloudSDK.MessageSenders.ListAssignments({level:'company', pageSize:100, commerceRole:'buyer', buyerID:buyerID})
                    .then(function(assignments) {
                        return _.map(availableMessageSenders.Items, function(ms) {
                            ms.selected = _.map(assignments.Items, 'MessageSenderID').indexOf(ms.ID) > -1;
                            return ms;
                        });
                    });
    }

    function _mapBuyerGroup(availableMessageSenders, buyerID, userGroupID) {
        return OrderCloudSDK.MessageSenders.ListAssignments({level:'group', pageSize:100, userGroupID:userGroupID, buyerID:buyerID, commerceRole:'buyer'})
                    .then(function(assignments) {
                        return _.map(availableMessageSenders.Items, function(ms) {
                            ms.selected = _.map(assignments.Items, 'MessageSenderID').indexOf(ms.ID) > -1;
                            return ms;
                        });
                    });
    }

    return service;
}