angular.module('orderCloud')
    .controller('SellerUserGroupCtrl', SellerUserGroupController)
;

function SellerUserGroupController($state, toastr, OrderCloudSDK, ocSellerUserGroups, SelectedSellerUserGroup) {
    var vm = this;
    vm.group = SelectedSellerUserGroup;
    vm.model = angular.copy(SelectedSellerUserGroup);

    vm.update = function() {
        OrderCloudSDK.AdminUserGroups.Update(vm.group.ID, vm.model)
            .then(function(updatedUserGroup) {
                if (updatedUserGroup.ID != vm.group.ID) $state.go('.', {sellerusergroupid:updatedUserGroup.ID}, {notify:false});
                vm.group = updatedUserGroup;
                vm.model = angular.copy(updatedUserGroup);
                SelectedSellerUserGroup = angular.copy(updatedUserGroup);
                toastr.success(vm.group.Name + ' was updated.');
            });
    };

    vm.delete = function() {
        ocSellerUserGroups.Delete(vm.group)
            .then(function() {
                toastr.success(vm.group.Name + ' was deleted.');
                $state.go('sellerUserGroups');
            });
    };
}