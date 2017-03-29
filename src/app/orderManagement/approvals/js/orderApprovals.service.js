angular.module('orderCloud')
    .factory('ocOrderApprovalsService', OrderCloudApprovalsService)
;

function OrderCloudApprovalsService($q, sdkOrderCloud) {
    var service = {
        List: _list
    };

    function _list(orderID, buyerID, page, pageSize) {
        var deferred = $q.defer();

        var options = {
            page: page,
            pageSize: pageSize,
            sortBy: 'Status'
        };
        sdkOrderCloud.Orders.ListApprovals('incoming', orderID, options)
            .then(function(data) {
                getApprovingUserGroups(data)
            });

        function getApprovingUserGroups(data) {
            var userGroupIDs = _.pluck(data.Items, 'ApprovingGroupID');
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: userGroupIDs.join('|')}
            };
            sdkOrderCloud.UserGroups.List(buyerID, options)
                .then(function(userGroupData) {
                    angular.forEach(data.Items, function(approval) {
                        approval.ApprovingUserGroup = _.findWhere(userGroupData.Items, {ID: approval.ApprovingGroupID});
                    });
                    getApprovalRules(data);
                })
                .catch(function() {
                    getApprovalRules(data);
                });
        }

        function getApprovalRules(data) {
            var approvalRuleIDs = _.pluck(data.Items, 'ApprovalRuleID');
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: approvalRuleIDs.join('|')}
            };
            sdkOrderCloud.ApprovalRules.List(buyerID, options)
                .then(function(approvalRuleData) {
                    angular.forEach(data.Items, function(approval) {
                        approval.ApprovalRule = _.findWhere(approvalRuleData.Items, {ID: approval.ApprovalRuleID});
                    });
                    deferred.resolve(data);
                })
                .catch(function() {
                    deferred.resolve(data);
                });
        }

        return deferred.promise;
    }

    return service;
}