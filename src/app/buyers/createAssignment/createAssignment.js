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
                UserGroupsList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List()
                }
            }
    })
}

function CreateAssignmentController(SelectedUser, Parameters, UserGroupsList) {
    var vm = this;

    vm.selectedUser = SelectedUser;
    vm.parameters = Parameters;
    vm.userGroupsList = UserGroupsList;

    //console.log('user', vm.selectedUser);
    console.log('params', vm.parameters);
    console.log('grouplist', vm.userGroupsList);
}