angular.module('orderCloud')
    .config(EditUserConfig)
    .controller('UserEditCtrl', UserEditController)
;

function EditUserConfig($stateProvider) {
    $stateProvider
        .state('users.edit', {
            url: '/:userid/edit',
            templateUrl: 'users/editUser/templates/editUser.html',
            controller: 'UserEditCtrl',
            controllerAs: 'userEdit',
            resolve: {
                SelectedUser: function($stateParams, OrderCloud) {
                    return OrderCloud.Users.Get($stateParams.userid);
                }
            }
        })

}


function UserEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedUser) {
    var vm = this,
        userid = SelectedUser.ID;
    vm.userName = SelectedUser.Username;
    vm.user = SelectedUser;
    if (vm.user.TermsAccepted != null) {
        vm.TermsAccepted = true;
    }

    vm.Submit = function() {
        var today = new Date();
        vm.user.TermsAccepted = today;
        OrderCloud.Users.Update(userid, vm.user)
            .then(function() {
                $state.go('users', {}, {reload: true});
                toastr.success('User Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.Users.Delete(userid)
            .then(function() {
                $state.go('users', {}, {reload: true});
                toastr.success('User Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}
