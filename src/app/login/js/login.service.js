angular.module('orderCloud')
    .factory('LoginService', LoginService)
;

function LoginService($q, $window, $state, $cookies, toastr, OrderCloud, sdkOrderCloud, ocRolesService, clientid, scope, defaultstate) {
    return {
        SendVerificationCode: _sendVerificationCode,
        ResetPassword: _resetPassword,
        RememberMe: _rememberMe,
        Logout: _logout
    };

    function _sendVerificationCode(email) {
        var deferred = $q.defer();

        var passwordResetRequest = {
            Email: email,
            ClientID: clientid,
            URL: encodeURIComponent($window.location.href) + '{0}'
        };

        OrderCloud.PasswordResets.SendVerificationCode(passwordResetRequest)
            .then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _resetPassword(resetPasswordCredentials, verificationCode) {
        var deferred = $q.defer();

        var passwordReset = {
            ClientID: clientid,
            Username: resetPasswordCredentials.ResetUsername,
            Password: resetPasswordCredentials.NewPassword
        };

        OrderCloud.PasswordResets.ResetPassword(verificationCode, passwordReset).
            then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _logout() {
        angular.forEach($cookies.getAll(), function(val, key) {
            $cookies.remove(key);
        });
        ocRolesService.Remove();
        $state.go('login', {}, {reload: true});
    }

    function _rememberMe(currentState) {
        var availableRefreshToken = sdkOrderCloud.GetRefreshToken() || null;

        if (availableRefreshToken) {
            sdkOrderCloud.Auth.RefreshToken(availableRefreshToken, clientid, scope)
                .then(function(data) {
                    sdkOrderCloud.Auth.SetToken(data.access_token);
                    var redirectTo = currentState || defaultstate;
                    $state.go(redirectTo);
                })
                .catch(function () {
                    toastr.error('Your token has expired, please log in again.');
                    _logout();
                });
        } else {
            _logout();
        }
    }
}