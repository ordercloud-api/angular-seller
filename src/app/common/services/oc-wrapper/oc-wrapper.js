angular.module('orderCloud')
    //TODO: rename this to 'OrderCloud' once we finish refactoring to the new SDK
    .factory('sdkOrderCloud', OrderCloudService)
;

function OrderCloudService($cookies, appname, apiurl, authurl) {
    // get sdk from global variable
    var sdk = nOrderCloud;
    var defaultClient = nOrderCloud.ApiClient.instance;
    var oauth2 = defaultClient.authentications['oauth2'];
    var authTokenCookieName = appname + '.token';
    var impersonationTokenCookieName = appname + '.impersonation.token';
    sdk.ApiClient.instance.baseApiPath = apiurl + '/v1';
    sdk.ApiClient.instance.baseAuthPath = authurl;

    var _getToken = function() {
        var token = $cookies.get(authTokenCookieName);
        oauth2.accessToken = token;
        return token;
    };

    var _getImpersonationToken = function() {
        var token = $cookies.get(impersonationTokenCookieName);
        oauth2.impersonationToken = token;
        return token;
    };

    var _setToken = function(token) {
        oauth2.accessToken = token;
        $cookies.put(authTokenCookieName, token);
    };

    var _setImpersonationToken = function(token) {
        oauth2.impersonationToken = token;
        $cookies.put(impersonationTokenCookieName, token);
    };

    sdk.GetToken = _getToken;
    sdk.GetIMpersonationToken = _getImpersonationToken;
    sdk.SetToken = _setToken;
    sdk.SetImpersonationToken = _setImpersonationToken;

    //init authentication for page refresh
    _getToken();
    _getImpersonationToken();

    return sdk;
}