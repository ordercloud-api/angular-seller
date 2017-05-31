angular.module('orderCloud')
    .provider('$ocFiles', OrderCloudFilesProvider)
;

function OrderCloudFilesProvider(scope) {
    var fileUploadOptions = {
        keyname: null,
        srcKeyname: null,
        folder:  null,
        extensions:  null,
        invalidExtensions:  null,
        uploadText:  null,
        onUpdate:  null,
        multiple: false,
        addText:  null,
        maxLimit:  null,
        additionalFields:  null,
        draggable: false
    };

    return {
        $get: function() {
             return {
                 GetFileUploadOptions: function() {
                    return fileUploadOptions;
                 }
             };
        },
        SetFileUploadOptions: function(fileUploadOptions) {
             fileUploadOptions = fileUploadOptions;
        }
    };

}