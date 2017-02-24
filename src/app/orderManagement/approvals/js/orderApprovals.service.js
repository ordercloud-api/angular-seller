angular.module('orderCloud')
    .factory('ocOrderApprovalsService', OrderCloudApprovalsService)
;

function OrderCloudApprovalsService($q, OrderCloud) {
    var service = {
        List: _list
    };

    function _list(orderID, buyerID, page, pageSize) {
        var deferred = $q.defer();

        OrderCloud.Orders.ListApprovals(orderID, null, page, pageSize, null, 'Status', null, buyerID)
            .then(function(data) {
                data.Items.push({
                    ApprovalRuleID: 'RequiresApproval',
                    ApproverEmail: 'test@test.com',
                    ApproverID: '234234234234234',
                    ApproverUserName: 'approvinguser234',
                    ApprovingGroupID: 'ApprovingUsers',
                    Comments: 'This looks good to me',
                    DateCompleted: '2017-02-11T22:04:21.88+00:00',
                    DateCreated: '2017-02-10T22:04:21.88+00:00',
                    Status: 'Approved'
                });
                data.Items.push({
                    ApprovalRuleID: 'RequiresApproval',
                    ApproverEmail: 'test@test.com',
                    ApproverID: '234234234234234',
                    ApproverUserName: 'approvinguser234',
                    ApprovingGroupID: 'ApprovingUsers',
                    Comments: 'No way DUDE',
                    DateCompleted: '2017-02-11T22:04:21.88+00:00',
                    DateCreated: '2017-02-10T22:04:21.88+00:00',
                    Status: 'Declined'
                })
                getApprovingUserGroups(data)
            });

        function getApprovingUserGroups(data) {
            var userGroupIDs = _.pluck(data.Items, 'ApprovingGroupID');
            OrderCloud.UserGroups.List(null, 1, 100, null, null, {ID: userGroupIDs.join('|')}, buyerID)
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
            OrderCloud.ApprovalRules.List(null, 1, 100, null, null, {ID: approvalRuleIDs.join('|')}, buyerID)
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