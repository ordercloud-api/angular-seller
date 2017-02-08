angular.module('orderCloud')
    .config(function($httpProvider) {
        //HTTP Interceptor for OrderCloud Authentication
        $httpProvider.interceptors.push(function($q, $rootScope) {
            return {
                'responseError': function(rejection) {
                    if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 401) {
                        $rootScope.$broadcast('OC:AccessInvalidOrExpired'); //Trigger RememberMe || AuthAnonymous in AppCtrl
                    }
                    if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 403){
                        $rootScope.$broadcast('OC:AccessForbidden'); //Trigger warning toastr message for insufficient permissions
                    }
                    return $q.reject(rejection);
                }
            };
        });
    })
;

