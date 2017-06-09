angular.module('orderCloud')
    .controller('ProductImagesCtrl', ProductImagesController)
;

function ProductImagesController(OrderCloudSDK, SelectedProduct) {
    var vm = this;
    vm.model = angular.copy(SelectedProduct);
    vm.defaultImage = vm.model.xp && vm.model.xp.Image ? vm.model.xp.Image.URL : null;
    vm.additionalImages = vm.model.xp && vm.model.xp.Image && vm.model.xp.Image.Items && vm.model.xp.Image.Items.length ? vm.model.xp.Image.Items : null;

    vm.fileUploadOptions = {
        keyname: 'image',
        folder: null,
        extensions: 'jpg, png, gif, jpeg, tiff',
        invalidExtensions: null,
        uploadText: 'Upload an image',
        onUpdate: patchImage,
        multiple: true
    };

    function patchImage(imageXP) {
        return OrderCloudSDK.Products.Patch(vm.model.ID, {
            xp: imageXP
        });
    }

}