angular.module('orderCloud')
    .controller('FileUploadModalCtrl', FileUploadModalController)
;

function FileUploadModalController($uibModalInstance, ocFilesService, Model, SelectedIndex, FileUploadOptions) {
    var vm = this;
    var multiple = FileUploadOptions.multiple;
    vm.files = multiple ? angular.copy(Model[FileUploadOptions.keyname][FileUploadOptions.arrayKeyName || 'Items']) : angular.copy(Model);
    vm.selectedIndex = angular.copy(SelectedIndex.toString());
    vm.additionalFields = angular.copy(FileUploadOptions.additionalFields);

    vm.fileUploadOptions = {
        keyname: multiple ? vm.selectedIndex : FileUploadOptions.keyname,
        srcKeyname: FileUploadOptions.srcKeyname,
        folder: null,
        extensions: 'jpg, png, gif, jpeg, tiff, svg',
        invalidExtensions: null,
        uploadText: null,
        multiple: false,
        modal: true
    };

    vm.submit = function() {
        if (multiple && !vm.files[vm.selectedIndex] || (vm.files[vm.selectedIndex] && !vm.files[vm.selectedIndex][FileUploadOptions.srcKeyname])) {
            vm.files.splice(vm.selectedIndex, 1);
        }
        if (vm.selectedIndex == -1) {
            var imageObject = vm.files[vm.selectedIndex];
            imageObject.ID = randomID();
            if (!vm.files || !vm.files.length) vm.files = [];
            vm.files.push(imageObject);
        }
        multiple 
            ? Model[FileUploadOptions.keyname][FileUploadOptions.arrayKeyName || 'Items'] = vm.files 
            : Model[FileUploadOptions.keyname] = vm.files[FileUploadOptions.keyname];
        if (FileUploadOptions.onUpdate) {
            FileUploadOptions.onUpdate(Model)
                .then(function() {
                    $uibModalInstance.close(Model);
                });
        } else {
            $uibModalInstance.close(Model);
        }
    };

    vm.cancel = function() {
        if (vm.selectedIndex == -1 && vm.files[vm.selectedIndex][FileUploadOptions.srcKeyname] && vm.files[vm.selectedIndex].Uploaded) {
            var split = vm.files[vm.selectedIndex][FileUploadOptions.srcKeyname].split('/');
            var fileKey = split[split.length - 1];
            ocFilesService.Delete(fileKey)
                .then(function() {
                    $uibModalInstance.dismiss(Model);
                });
        }
        else {
            $uibModalInstance.dismiss(Model);
        }
    };

    function randomID() {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var string_length = 15;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum + 1);
        }
        return randomstring;
    }
}