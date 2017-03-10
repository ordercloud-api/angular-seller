angular.module('orderCloud')
    .config(UserUploadConfig)
;

function UserUploadConfig($stateProvider) {
    $stateProvider
        .state('users.userUpload', {
            url: '/user-upload',
            templateUrl: 'buyerManagement/users/upload/templates/upload.html',
            controller: 'UserUploadCtrl',
            controllerAs: 'userUpload',
            data: {
                pageTitle: 'User Upload'
            }
        })
    ;
}