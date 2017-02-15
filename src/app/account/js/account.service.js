angular.module('orderCloud')
    .factory('AccountService', AccountService)
;

function AccountService($q, $uibModal, OrderCloud, toastr) {
    var service = {
        Update: _update,
        ChangePassword: _changePassword
    };

    function _update(currentProfile, newProfile) {
        var deferred = $q.defer();

        function updateUser() {
            OrderCloud.Me.Update(newProfile)
                .then(function(data) {
                    deferred.resolve(data);
                })
                .catch(function(ex) {
                    deferred.reject(ex);
                });
        }

        $uibModal.open({
            animation: true,
            templateUrl: 'account/templates/confirmPassword.modal.html',
            controller: 'ConfirmPasswordModalCtrl',
            controllerAs: 'confirmPasswordModal',
            size: 'md'
        }).result.then(function(password) {
            var checkPasswordCredentials = {
                Username: currentProfile.Username,
                Password: password
            };

            OrderCloud.Auth.GetToken(checkPasswordCredentials)
                .then(function() {
                    updateUser();
                    toastr.success('Account changes were saved.', 'Success!');
                })
                .catch(function(ex) {
                    deferred.reject(ex);
                });
        }, function() {
            angular.noop();
        });

        return deferred.promise;
    }

    function _changePassword(currentUser) {
        var deferred = $q.defer();

        var checkPasswordCredentials = {
            Username: currentUser.Username,
            Password: currentUser.CurrentPassword
        };

        function changePassword() {
            currentUser.Password = currentUser.NewPassword;
            OrderCloud.Me.Update(currentUser)
                .then(function() {
                    deferred.resolve();
                });
        }

        OrderCloud.Auth.GetToken(checkPasswordCredentials)
            .then(function() {
                changePassword();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    return service;
}