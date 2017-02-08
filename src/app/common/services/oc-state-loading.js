angular.module('orderCloud')
    .factory('ocStateLoading', function($q) {
        var stateLoading = {};
        var service = {
            Watch: _watch,
            Start: _start,
            End: _end
        };

        function _watch(key) {
            return stateLoading[key];
        }

        function _start(key) {
            stateLoading[key] = $q.defer();
        }

        function _end() {
            angular.forEach(stateLoading, function(val, key) {
                if (stateLoading[key].promise && !stateLoading[key].promise.$cgBusyFulfilled) {
                    stateLoading[key].resolve();  //resolve leftover loading promises
                }
            })
        }

        return service;

    })
;

