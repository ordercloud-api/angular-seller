angular.module('orderCloud')
    .factory('RouteManagement', RouteManagementFactory)
;

function RouteManagementFactory($cookies) {

    return {
        GetUserFrom: _getUserFrom,
        SetUserFrom: _setUserFrom
    };

    function _getUserFrom() {
        return $cookies.getObject('userFrom');
    }

    function _setUserFrom(user) {
        $cookies.putObject('userFrom', {value: user});
    }
}
