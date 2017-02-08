angular.module('orderCloud')
    .run(AppRun)
;

function AppRun($rootScope, $exceptionHandler, ocStateLoading, defaultstate, defaultErrorMessageResolver) {
    $rootScope.$on('$stateChangeStart', function(e, toState) {
        var parent = toState.parent || toState.name.split('.')[0];
        console.log(parent);
        ocStateLoading.Start(parent);
    });

    $rootScope.$on('$stateChangeSuccess', function() {
        ocStateLoading.End();
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        if (toState.name == defaultstate) event.preventDefault(); //prevent infinite loop when error occurs on default state (otherwise in Routing config)
        $exceptionHandler(error);
        ocStateLoading.End();
    });

    //Set Custom Error Messages for angular-auto-validate      --- http://jonsamwell.github.io/angular-auto-validate/ ---
    defaultErrorMessageResolver.getErrorMessages().then(function (errorMessages) {
        var messages = {
            customPassword: 'Password must be at least eight characters long and include at least one letter and one number',
            positiveInteger: 'Please enter a positive integer',
            ID_Name: 'Only Alphanumeric characters, hyphens and underscores are allowed',
            confirmpassword: 'Your passwords do not match',
            noSpecialChars: 'Only Alphanumeric characters are allowed',
            'Buyer.UnavailableID': 'This ID is already in use.'
        };
        angular.extend(errorMessages, messages);
    });
}