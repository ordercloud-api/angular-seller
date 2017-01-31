angular.module('orderCloud')
    .controller('UserGroupCtrl', UserGroupController)
    .factory('ocUserGroups', OCUserGroupsService)
;

function UserGroupController(SelectedUserGroup) {
    var vm = this;
    vm.group = SelectedUserGroup;
}

function OCUserGroupsService(OrderCloud) {
    var service = {
        ListUsers: _listUsers
    };

    function _listUsers(buyerID, groupID) {
        return OrderCloud.UserGroups.ListUserAssignments(groupID, null)
            .then(function(data) {
                var userIDs = _.pluck(data.Items, 'UserID').join("|");
                return OrderCloud.Users.List(null, null, null, null, null, null, {ID:userIDs}, buyerID)
                    .then(function(data2) {
                        data.Items = data2.Items;
                        return data;
                    })
            })
    }

    return service;
}