angular.module('orderCloud')
    .controller('AppCtrl', AppController)
;

function AppController($q, $rootScope, $state, $ocMedia, toastr, LoginService, appname, defaultstate) {
    var vm = this;
    vm.name = appname;
    vm.$state = $state;
    vm.$ocMedia = $ocMedia;
    vm.stateLoading = {};

    function cleanLoadingIndicators() {
        angular.forEach(vm.stateLoading, function(val, key) {
            if (vm.stateLoading[key].promise && !vm.stateLoading[key].promise.$cgBusyFulfilled) {
                vm.stateLoading[key].resolve();
            } //resolve leftover loading promises
        })
    }

    //Detect if the app was loaded on a touch device with relatively good certainty
    //http://stackoverflow.com/a/6262682
    vm.isTouchDevice = (function() {
        var el = document.createElement('div');
        el.setAttribute('ongesturestart', 'return;'); // or try "ontouchstart"
        return typeof el.ongesturestart === "function";
    })();

    vm.logout = function() {
        LoginService.Logout();
    };

    $rootScope.$on('$stateChangeStart', function(e, toState) {
        cleanLoadingIndicators();
        var parent = toState.parent || toState.name.split('.')[0];
        vm.stateLoading[parent] = $q.defer();
    });

    $rootScope.$on('$stateChangeSuccess', function() {
        cleanLoadingIndicators();
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        if (toState.name == defaultstate) event.preventDefault(); //prevent infinite loop when error occurs on default state (otherwise in Routing config)
        cleanLoadingIndicators();
        console.log(error);
    });

    $rootScope.$on('OC:AccessInvalidOrExpired', function() {
        LoginService.RememberMe();
    });

    $rootScope.$on('OC:AccessForbidden', function(){
        toastr.warning("You do not have permission to access this page.");
    });
}