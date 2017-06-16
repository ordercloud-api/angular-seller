angular.module('orderCloud')
    .factory('ocOrderApprovalsService', OrderCloudApprovalsService)
;

function OrderCloudApprovalsService($q, OrderCloudSDK, ocRoles) {
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
        OrderCloudSDK.Orders.ListApprovals('incoming', orderID, options)
            .then(function(data) {
                if (!data.Items.length) {
                    deferred.resolve(data);
                } else if (ocRoles.UserIsAuthorized(['UserGroupReader', 'UserGroupAdmin'], true)) {
                    getApprovingUserGroups(data);
                } else {
                    getApprovalRules(data);
                }
            });

        function getApprovingUserGroups(data) {
            var userGroupIDs = _.map(data.Items, 'ApprovingGroupID');
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: userGroupIDs.join('|')}
            };
            OrderCloudSDK.UserGroups.List(buyerID, options)
                .then(function(userGroupData) {
                    angular.forEach(data.Items, function(approval) {
                        approval.ApprovingUserGroup = _.find(userGroupData.Items, {ID: approval.ApprovingGroupID});
                    });
                    getApprovalRules(data);
                })
                .catch(function() {
                    getApprovalRules(data);
                });
        }

        function getApprovalRules(data) {
            var approvalRuleIDs = _.map(data.Items, 'ApprovalRuleID');
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: approvalRuleIDs.join('|')}
            };
            OrderCloudSDK.ApprovalRules.List(buyerID, options)
                .then(function(approvalRuleData) {
                    angular.forEach(data.Items, function(approval) {
                        approval.ApprovalRule = _.find(approvalRuleData.Items, {ID: approval.ApprovalRuleID});
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