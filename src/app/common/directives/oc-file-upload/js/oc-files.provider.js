angular.module('orderCloud')
    .provider('$ocFiles', OrderCloudFilesProvider)
;

function OrderCloudFilesProvider() {
    var fileUploadOptions = {
        keyname: 'file',
        srcKeyname: 'URL',
        folder:  null,
        extensions:  null,
        invalidExtensions:  null,
        uploadText:  'Browse files',
        replaceText: 'Replace file',
        onUpdate:  null,
        multiple: false,
        addText:  'Add a file',
        maxLimit:  10,
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
        SetFileUploadOptions: function(options) {
            fileUploadOptions = angular.extend(fileUploadOptions, options);
        }
    };

}