angular.module('orderCloud')
    .config(UploadConfig)
;

function UploadConfig($stateProvider) {
    $stateProvider
        .state('products.upload', {
            parent: 'base',
            url: '/upload',
            templateUrl: 'productManagement/upload/templates/upload.html',
            controller: 'UploadCtrl',
            controllerAs: 'upload'
        })
    ;
}