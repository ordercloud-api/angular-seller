angular.module('orderCloud')
    .controller('FileUploadModalCtrl', FileUploadModalController)
;

function FileUploadModalController($uibModalInstance, ocFiles, FileUploadOptions, CurrentValue) {
    var vm = this;
    vm.additionalFields = angular.copy(FileUploadOptions.additionalFields);
    vm.invalidExtension = false;
    vm.options = FileUploadOptions;
    vm.model = angular.copy(CurrentValue);

    var allowed = parseExtensions(FileUploadOptions.extensions);
    var notAllowed = parseExtensions(FileUploadOptions.invalidExtensions);
    function parseExtensions(extensions) {
        var result = {
            Extensions: [],
            Types: []
        };
        if (!extensions) return result;
        var items = _.map(extensions.split(','), function(ext) {
            return ext.replace(/ /g, '').replace(/\./g, '').toLowerCase();
        });
        angular.forEach(items, function(item) {
            if (item.indexOf('/') > -1) {
                if (item.indexOf('*') > -1) {
                    result.Types.push(item.split('/')[0]);
                }
                else {
                    result.Extensions.push(item.split('/')[1]);
                }
            }
            else {
                result.Extensions.push(item);
            }
        });
        return result;
    }

    vm.upload = function() {
        $('#orderCloudUpload').click();
    };

    angular.element(document).ready(filInputInit);

    function filInputInit() {
        $('#orderCloudUpload').bind('change', updateModel);
    }

    function updateModel(event) {
        if (event.target.files[0] === null) return;
        var fileName = event.target.files[0].name, 
            valid = true, 
            ext;

        if ((allowed.Extensions.length || allowed.Types.length) && fileName) {
            ext = fileName.split('.').pop().toLowerCase();
            valid = (allowed.Extensions.indexOf(ext) !== -1 || allowed.Types.indexOf(event.target.files[0].type.split('/')[0]) > -1);
        }
        if ((notAllowed.Extensions.length || notAllowed.Types.length) && fileName) {
            ext = fileName.split('.').pop().toLowerCase();
            valid = (notAllowed.Extensions.indexOf(ext) === -1 && notAllowed.Types.indexOf(event.target.files[0].type.split('/')[0]) === -1);
        }
        if (valid) {
            vm.invalidExtension = false;
            ocFiles.Upload(event.target.files[0], vm.options.folder) 
                .then(function(fileData) {
                    vm.model[vm.options.srcKeyname] = fileData.Location;
                    vm.model.Uploaded = true;
                });
        } else {
            vm.invalidExtension = true;
            var input;
            event.target.files[0] = null;
            input = $('#orderCloudUpload').find('input').clone(true);
            $('#orderCloudUpload').find('input').replaceWith(input);
        }
    }

    vm.submit = function() {
        $uibModalInstance.close(vm.model);
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}