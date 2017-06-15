angular.module('orderCloud')
    .controller('ProductImagesCtrl', ProductImagesController)
;

function ProductImagesController(OrderCloudSDK, SelectedProduct, toastr, $state, $exceptionHandler, ocImagesModal) {
    var vm = this;
    vm.model = angular.copy(SelectedProduct);
    if (!vm.model.xp) vm.model.xp = {};
    vm.defaultImage = vm.model.xp && vm.model.xp.image ? vm.model.xp.image.URL : null;
    vm.additionalImages = vm.model.xp && vm.model.xp.additionalImages && vm.model.xp.additionalImages.length ? vm.model.xp.additionalImages : null;

    if (!vm.defaultImage) vm.model.xp.imageZoom = false;

    vm.fileUploadOptions = {
        keyname: 'image',
        srcKeyname: 'URL',
        folder: null,
        extensions: 'jpg, png, gif, jpeg, tiff',
        invalidExtensions: null,
        onUpdate: patchImage,
        multiple: false,
        addText: 'Upload an image',
        replaceText: 'Replace',
    };

    vm.openImageModal = openImageModal;
    vm.toggleZoom = toggleZoom;
    
    function openImageModal(index) {
        if(vm.model.xp.imageZoom) {
            ocImagesModal.Open(vm.model.xp.image, index)
        }
    }

    function toggleZoom() {
        return OrderCloudSDK.Products.Patch(vm.model.ID, {
            xp: {
                imageZoom: vm.model.xp.imageZoom
            }
        }).then(function(data) {
            var message;
            if(data.xp.imageZoom) {
                message = 'Zoom enabled on images for ' + vm.model.Name;
            } else {
                message = 'Zoom disabled on images for ' + vm.model.Name;
            }
            toastr.success(message, 'Success');
        });
    }

    function patchImage(imageXP) {
        return OrderCloudSDK.Products.Patch(vm.model.ID, {
            xp: imageXP
        })
        .then(function() {
            toastr.success('Images successfully updated', 'Success');
            $state.go('product.images', {productid: vm.model.ID}, {reload: true});
        })
        .catch(function(ex) {
            $exceptionHandler(ex);
        })
    }
}