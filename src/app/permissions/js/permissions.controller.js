angular.module('orderCloud')
    .controller('PermissionsCtrl', PermissionsController)
;

function PermissionsController($scope, $interpolate, $state, $exceptionHandler, $stateParams, toastr, Assignments, AvailableProfiles, OrderCloudSDK) {
    var vm = this;
    vm.pageTitle = $state.current.data.pageTitle;
    vm.message = $interpolate($state.current.data.message)($scope);
    vm.assignments = Assignments;
    vm.profiles = AvailableProfiles;
    vm.buyerid = $stateParams.buyerid;
    vm.usergroupid = $stateParams.usergroupid;
    vm.adminusergroupid = $stateParams.adminusergroupid;

    vm.updateAssignment = function(scope) {
        if (scope.profile.selected) {
            var assignment = {
                securityProfileID: scope.profile.ID,
                buyerID: $stateParams.buyerid,
                userGroupID: $stateParams.usergroupid || $stateParams.sellerusergroupid
            };
            OrderCloudSDK.SecurityProfiles.SaveAssignment(assignment)
                .then(function() {
                    toastr.success(scope.profile.Name + ' was enabled.');
                })
                .catch(function(ex) {
                    scope.profile.selected = false;
                    $exceptionHandler(ex);
                });
        } else {
            var options = {
                buyerID: $stateParams.buyerid,
                userGroupID: $stateParams.usergroupid || $stateParams.sellerusergroupid
            };
            OrderCloudSDK.SecurityProfiles.DeleteAssignment(scope.profile.ID, options)
                .then(function() {
                    toastr.success(scope.profile.Name + ' was disabled.');
                })
                .catch(function(ex) {
                    scope.profile.selected = true;
                    $exceptionHandler(ex);
                });
        }
    };
}
