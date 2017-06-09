angular.module('orderCloud')
    .controller('MessageSendersCtrl', MessageSendersController)
;

function MessageSendersController($exceptionHandler, $scope, $state, $stateParams, $interpolate, toastr, AvailableMessageSenders, OrderCloudSDK) {
    var vm = this;
    vm.pageTitle = $state.current.data.pageTitle;
    vm.message = $interpolate($state.current.data.message)($scope);
    vm.list = AvailableMessageSenders;

    vm.updateAssignment = function(scope) {
        if (scope.messageSender.selected) {
            var assignment = {
                messageSenderID: scope.messageSender.ID,
                buyerID: $stateParams.buyerid,
                userGroupID: $stateParams.usergroupid || $stateParams.sellerusergroupid
            };
            OrderCloudSDK.MessageSenders.SaveAssignment(assignment)
                .then(function() {
                    toastr.success(scope.messageSender.Name + ' was enabled.');
                })
                .catch(function(ex) {
                    scope.messageSender.selected = false;
                    $exceptionHandler(ex);
                });
        } else {
            var options = {
                buyerID: $stateParams.buyerid,
                userGroupID: $stateParams.usergroupid || $stateParams.sellerusergroupid
            };
            OrderCloudSDK.MessageSenders.DeleteAssignment(scope.messageSender.ID, options)
                .then(function() {
                    toastr.success(scope.messageSender.Name + ' was disabled.');
                })
                .catch(function(ex) {
                    scope.messageSender.selected = true;
                    $exceptionHandler(ex);
                });
        }
    };
}