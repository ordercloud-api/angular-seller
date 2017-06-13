angular.module('orderCloud')
    .factory('ocStateLoading', function($rootScope, $exceptionHandler, defaultstate, $q, OrderCloudSDK, ocRefreshToken) {
        var stateLoading = {};
        var service = {
            Init: _init,
            Watch: _watch
        };

        function _init() {
            $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState) {
                var toParent = toState.parent || toState.name.split('.')[0];
                var fromParent = fromState.parent || fromState.name.split('.')[0];
                stateLoading[fromParent === toParent ? toParent : 'base'] = $q.defer();

                var token = OrderCloudSDK.GetToken();
                if(token) {
                    var expiresIn = JSON.parse(atob(token.split('.')[1])).exp * 1000;
                    var tokenExpired = expiresIn < Date.now();
                }

                if((!toState.data || (toState.data && !toState.data.ignoreToken)) && (!token || tokenExpired)) {
                    e.preventDefault();
                    ocRefreshToken(toState.name);
                }
            });

            $rootScope.$on('$stateChangeSuccess', function() {
                document.body.scrollTop = document.documentElement.scrollTop = 0;
                _end();
            });

            $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
                if (toState.name === defaultstate) event.preventDefault(); //prevent infinite loop when error occurs on default state (otherwise in Routing config)
                error.data ? $exceptionHandler(error) : $exceptionHandler({message:error});
                _end();
            });
        }

        function _watch(key) {
            return stateLoading[key];
        }

        function _end() {
            angular.forEach(stateLoading, function(val, key) {
                if (stateLoading[key].promise && !stateLoading[key].promise.$cgBusyFulfilled) {
                    stateLoading[key].resolve();  //resolve leftover loading promises
                }
            });
        }

        return service;

    })
;

