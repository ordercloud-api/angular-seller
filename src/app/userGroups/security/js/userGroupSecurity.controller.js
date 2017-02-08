angular.module('orderCloud')
    .controller('UserGroupSecurityCtrl', UserGroupSecurityController)
;

function UserGroupSecurityController($exceptionHandler, $stateParams, toastr, AvailableProfiles, Assignments, OrderCloud) {
    var vm = this;

    vm.profiles = _.map(AvailableProfiles.Items, function(profile) {
        profile.selected = _.pluck(Assignments.Items, 'SecurityProfileID').indexOf(profile.ID) > -1;
        return profile;
    });

    vm.updateAssignment = function(scope, groupid) {
        if (scope.profile.selected) {
            OrderCloud.SecurityProfiles.SaveAssignment({
                SecurityProfileID: scope.profile.ID,
                BuyerID: $stateParams.buyerid,
                UserGroupID: groupid
            })
                .then(function() {
                    toastr.success(scope.profile.Name + ' was enabled.', 'Success!');
                })
                .catch(function(ex) {
                    scope.profile.selected = false;
                    $exceptionHandler(ex);
                });
        } else {
            OrderCloud.SecurityProfiles.DeleteAssignment(scope.profile.ID, null, groupid, $stateParams.buyerid)
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