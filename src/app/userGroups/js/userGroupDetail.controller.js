angular.module('orderCloud')
    .controller('UserGroupDetailCtrl', UserGroupDetailController)
    .factory('ocUserGroups', OCUserGroupsService)
;

function UserGroupDetailController($stateParams, SelectedUserGroup, AssignedUsers, OrderCloud) {
    var vm = this;
    vm.group = SelectedUserGroup;
    vm.users = AssignedUsers;

    vm.userList = [];
    vm.onOpenUserSelect = function(isOpen) {
        if (isOpen && !vm.userList.length) {
            OrderCloud.Users.List(null, null, null, null, null, null, null, $stateParams.buyerid)
                .then(function(data) {
                    vm.userList = data.Items;
                });
        }
    }
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