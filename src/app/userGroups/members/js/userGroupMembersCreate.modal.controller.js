angular.module('orderCloud')
    .controller('UserGroupMembersCreateModalCtrl', UserGroupMembersCreateModalController)
;

function UserGroupMembersCreateModalController($q, $uibModalInstance, SelectedUserGroup, SelectedBuyerID, OrderCloud) {
    var vm = this;
    vm.userGroup = SelectedUserGroup;
    vm.uiSelectUsers = {Items:[]};

    vm.listUsers = function(searchTerm) {
        if (searchTerm === "") searchTerm = null;
        OrderCloud.Users.List(null, searchTerm, null, null, null, null, null, SelectedBuyerID)
            .then(function(data) {
                vm.uiSelectUsers = data;
            })
    };

    vm.submit = function() {
        var queue = [],
            success = [];

        angular.forEach(vm.selectedUsers, function(user) {
            queue.push((function() {
                var d = $q.defer();
                OrderCloud.UserGroups.SaveUserAssignment({UserID: user.ID, UserGroupID: vm.userGroup.ID}, SelectedBuyerID)
                    .then(function() {
                        success.push(user);
                        d.resolve();
                    })
                    .catch(function() {
                        d.resolve();
                    });
                return d.promise;
            })());
        });

        vm.loading = $q.all(queue)
            .then(function() {
                $uibModalInstance.close(success);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    }
}