angular.module('orderCloud')
    .config(function($urlMatcherFactoryProvider, $locationProvider, $urlRouterProvider, defaultstate) {
        //Routing
        $urlMatcherFactoryProvider.strictMode(false);
        $locationProvider.html5Mode(true);
        $urlRouterProvider
            .otherwise(function ($injector) {
                $injector.get('$state').go(defaultstate); //Set the default state name in app.constants.json
            });
    })
;


