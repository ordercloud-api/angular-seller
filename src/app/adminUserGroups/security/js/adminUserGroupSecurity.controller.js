angular.module('orderCloud')
    .controller('AdminUserGroupSecurityCtrl', AdminUserGroupSecurityController)
;

function AdminUserGroupSecurityController($exceptionHandler, $stateParams, toastr, AvailableProfiles, Assignments, OrderCloud) {
    var vm = this;

    console.log(Assignments);

    vm.profiles = _.map(AvailableProfiles.Items, function(profile) {
        profile.selected = _.pluck(Assignments.Items, 'SecurityProfileID').indexOf(profile.ID) > -1;
        return profile;
    });

    vm.updateAssignment = function(scope) {
        if (scope.profile.selected) {
            OrderCloud.SecurityProfiles.SaveAssignment({
                SecurityProfileID: scope.profile.ID,
                UserGroupID: $stateParams.adminusergroupid
            })
                .then(function() {
                    toastr.success(scope.profile.Name + ' was enabled.', 'Success!');
                })
                .catch(function(ex) {
                    scope.profile.selected = false;
                    $exceptionHandler(ex);
                });
        } else {
            OrderCloud.SecurityProfiles.DeleteAssignment(scope.profile.ID, null, $stateParams.adminusergroupid)
                .then(function() {
                    toastr.success(scope.profile.Name + ' was disabled.', 'Success!');
                })
                .catch(function(ex) {
                    scope.profile.selected = true;
                    $exceptionHandler(ex);
                });
        }
    }
}