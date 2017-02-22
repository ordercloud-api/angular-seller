angular.module('orderCloud')
    .run(AppRun)
;

function AppRun(ocStateLoading, defaultErrorMessageResolver, ocErrorMessages) {
    ocStateLoading.Init();

    defaultErrorMessageResolver.getErrorMessages().then(function (errorMessages) {
        angular.extend(errorMessages, ocErrorMessages);
    });
}