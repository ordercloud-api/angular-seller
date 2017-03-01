angular.module('orderCloud')
    .controller('SecurityCtrl', SecurityController)
;

function SecurityController($exceptionHandler, $stateParams, toastr, Assignments, AvailableProfiles, OrderCloud) {
    var vm = this;
    vm.assignments = Assignments;
    vm.profiles = AvailableProfiles;
    vm.buyerid = $stateParams.buyerid;
    vm.usergroupid = $stateParams.usergroupid;
    vm.adminusergroupid = $stateParams.adminusergroupid;
    vm.isAdmin = !(vm.buyerid || vm.usergroupid || vm.adminusergroupid);

    vm.updateAssignment = function(scope) {
        if (scope.profile.selected) {
            OrderCloud.SecurityProfiles.SaveAssignment({
                SecurityProfileID: scope.profile.ID,
                BuyerID: $stateParams.buyerid,
                UserGroupID: $stateParams.usergroupid || $stateParams.adminusergroupid
            })
                .then(function() {
                    toastr.success(scope.profile.Name + ' was enabled.');
                })
                .catch(function(ex) {
                    scope.profile.selected = false;
                    $exceptionHandler(ex);
                });
        } else {
            OrderCloud.SecurityProfiles.DeleteAssignment(scope.profile.ID, null, $stateParams.usergroupid || $stateParams.adminusergroupid, $stateParams.buyerid)
                .then(function() {
                    toastr.success(scope.profile.Name + ' was disabled.');
                })
                .catch(function(ex) {
                    scope.profile.selected = true;
                    $exceptionHandler(ex);
                });
        }
    }
}
