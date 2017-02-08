angular.module('orderCloud')
    .config(function($urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider, defaultstate) {
        //Routing
        $locationProvider.html5Mode(true);
        $urlMatcherFactoryProvider.strictMode(false);
        $urlRouterProvider.otherwise(function ($injector) {
            var $state = $injector.get('$state');
            $state.go(defaultstate); //Set the default state name in app.constants.json
        });
    })
;

