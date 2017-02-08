angular.module('orderCloud')
    .config(function($httpProvider) {
        //HTTP Interceptor for OrderCloud Authentication
        $httpProvider.interceptors.push(function($q, $injector) {
            return {
                'responseError': function(rejection) {
                    if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 401) {
                        $injector.get('LoginService').RememberMe();
                    }
                    if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 403){
                        $injector.get('toastr').warning('You do not have permission to do this.');
                    }
                    return $q.reject(rejection);
                }
            };
        });
    })
;

