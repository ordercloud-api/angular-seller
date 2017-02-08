angular.module('orderCloud')
    .run(AppRun)
;

function AppRun(defaultErrorMessageResolver) {

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