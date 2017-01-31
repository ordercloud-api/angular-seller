angular.module('orderCloud')
    .controller('UserGroupMembersCreateModalCtrl', UserGroupMembersCreateModalController)
;

function UserGroupMembersCreateModalController($uibModalInstance, SelectedUserGroup, SelectedBuyerID, UsersList, OrderCloud) {
    var vm = this;
    vm.userGroup = SelectedUserGroup;
    vm.uiSelectUsers = UsersList;

    vm.listUsers = function(searchTerm) {
        OrderCloud.Users.List(SelectedUserGroup.ID, searchTerm, null, null, null, null, null, SelectedBuyerID)
            .then(function(data) {
                vm.uiSelectUsers = data;
            })
    };

    vm.submit = function() {

    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}