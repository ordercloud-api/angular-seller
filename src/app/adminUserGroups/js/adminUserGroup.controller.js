angular.module('orderCloud')
    .controller('AdminUserGroupCtrl', AdminUserGroupController)
;

function AdminUserGroupController(SelectedAdminUserGroup){
    var vm = this;
    vm.userGroup = SelectedAdminUserGroup;

    vm.editInfo = function() {

    };

    vm.addMembers = function() {

    };
}