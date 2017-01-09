angular.module('orderCloud')
    .config(CreateAssignmentConfig)
    .controller('CreateAssignmentCtrl', CreateAssignmentController)
;

function CreateAssignmentConfig($stateProvider) {
    $stateProvider
        .state('buyers.createAssignment', {
            url: '/:userID/createassignment',
            templateUrl: 'buyers/createAssignment/templates/createAssignment.html',
            controller: 'CreateAssignmentCtrl',
            controllerAs: 'createAssignment',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                SelectedUser: function($stateParams, OrderCloud) {
                    return OrderCloud.Users.Get($stateParams.userID);
                },
                SelectedBuyer: function($stateParams, OrderCloud) {
                    return OrderCloud.Buyers.Get($stateParams.buyerid);
                },
                UserGroupsList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List()
                }
            }
    })
}

function CreateAssignmentController($q, $state, OrderCloud, toastr, Parameters, SelectedUser, SelectedBuyer, UserGroupsList) {
    var vm = this;

    vm.selectedBuyer = SelectedBuyer;
    vm.selectedUser = SelectedUser;
    vm.userGroupsList = UserGroupsList;

    vm.saveAssignments = SaveAssignments;

    function SaveAssignments() {
        var userGroupQueue = [];
        var df = $q.defer();

        angular.forEach(vm.selectedUserGroup, function(group) {
            userGroupQueue.push(OrderCloud.UserGroups.SaveUserAssignment(
                {
                    userGroupAssignment: group.ID,
                    BuyerID: vm.selectedBuyer.ID
                }
            ))
        });
        $q.all(userGroupQueue)
            .then(function() {
                df.resolve();
                toastr.success('All UserGroup Assignments Save', 'Success');
            })
            .catch(function(error) {
                toastr.error(error);
            })
            .finally(function() {
                //$state.go('buyers.details', {buyerid: Parameters.buyerid}, {reload:true})
            })
    }

}