angular.module('orderCloud')
    .factory('ocRoles', OrderCloudRoles)
;

function OrderCloudRoles($window, OrderCloud) {
    var service = {
        Set: _set,
        Get: _get,
        Remove: _remove,
        IsAuthorized: _isAuthorized
    };

    var roles;

    function base64Decode(string) {
        var output = string.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0: { break; }
            case 2: { output += '=='; break; }
            case 3: { output += '='; break; }
            default: {
                console.log('Illegal base64url string');
                return;
            }
        }
        return $window.decodeURIComponent(escape($window.atob(output))); //polyfill https://github.com/davidchambers/Base64.js
    }

    function _set(token) {
        if (!token) return;

        var tokenParts = token.split('.');

        if (tokenParts.length != 3) {
            console.warn('ocRoles', 'Token is not valid');
            return;
        }

        var decodedToken = base64Decode(tokenParts[1]);
        if (!decodedToken) {
            console.warn('ocRoles', 'Cannot decode token');
            return;
        }

        var decodedTokenObject = JSON.parse(decodedToken);
        roles = decodedTokenObject.role;

        return roles;
    }

    function _get() {
        return roles || _set(OrderCloud.Auth.ReadToken());
    }

    function _remove() {
        roles = null;
    }

    function _isAuthorized(userRoles, requiredRoles) {
        return (userRoles.indexOf('FullAccess') > -1) || _.difference(requiredRoles, userRoles).length == 0;
    }

    return service;
}