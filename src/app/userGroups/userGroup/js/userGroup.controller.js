angular.module('orderCloud')
    .controller('UserGroupCtrl', UserGroupController)
    .factory('ocUserGroups', OCUserGroupsService)
;

function UserGroupController($state, $stateParams, toastr, OrderCloud, ocConfirm, SelectedUserGroup) {
    var vm = this;
    vm.group = SelectedUserGroup;
    vm.model = angular.copy(SelectedUserGroup);

    vm.update = function() {
        OrderCloud.UserGroups.Update(vm.group.ID, vm.model, $stateParams.buyerid)
            .then(function(updatedUserGroup) {
                if (updatedUserGroup.ID != vm.group.ID) $state.go('.', {usergroupid:updatedUserGroup.ID}, {notify:false});
                vm.group = updatedUserGroup;
                vm.model = angular.copy(updatedUserGroup);
                SelectedUserGroup = angular.copy(updatedUserGroup);
                toastr.success('User group was updated.', 'Success!')
            })
    };

    vm.delete = function() {
        ocConfirm.confirm({message: 'Are you sure you want to delete this user group and all of it\'s assignments? <br/> <b>This action cannot be undone.</b>', confirmText: 'Yes, delete this group', cancelText: 'No'})
            .then(function() {
                OrderCloud.UserGroups.Delete(vm.group.ID, $stateParams.buyerid)
                    .then(function() {
                        toastr.success('User group was deleted.', 'Success!');
                        $state.go('userGroups');
                    })
            })
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