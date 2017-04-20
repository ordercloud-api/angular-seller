angular.module('orderCloud')
    .controller('UserGroupCtrl', UserGroupController);

function UserGroupController($state, $stateParams, toastr, OrderCloudSDK, ocUserGroups, ocNavItems, SelectedUserGroup) {
    var vm = this;
    vm.group = SelectedUserGroup;
    vm.model = angular.copy(SelectedUserGroup);

    vm.navigationItems = ocNavItems.Filter(ocNavItems.BuyerUserGroup());

    vm.isActive = function (navItem) {
        var isActive = false;
        checkNavItem(navItem);

        function checkNavItem(item) {
            if (!isActive) {
                if (!item.activeWhen) {
                    if (item.state) {
                        isActive = $state.is(item.state);
                    } else {
                        var splitItem = item.split('*');
                        isActive = $state[splitItem.length > 1 ? 'includes' : 'is'](splitItem[0]);
                    }
                } else {
                    _.each(item.activeWhen, checkNavItem);
                }
            }
        }
        return isActive;
    };

    vm.update = function () {
        OrderCloudSDK.UserGroups.Update($stateParams.buyerid, vm.group.ID, vm.model)
            .then(function (updatedUserGroup) {
                if (updatedUserGroup.ID != vm.group.ID) $state.go('.', {
                    usergroupid: updatedUserGroup.ID
                }, {
                    notify: false
                });
                vm.group = updatedUserGroup;
                vm.model = angular.copy(updatedUserGroup);
                SelectedUserGroup = angular.copy(updatedUserGroup);
                toastr.success(vm.group.Name + ' was updated.');
            });
    };

    vm.delete = function () {
        ocUserGroups.Delete(vm.group, $stateParams.buyerid)
            .then(function () {
                toastr.success(vm.group.Name + ' was deleted.');
                $state.go('userGroups');
            });
    };
}