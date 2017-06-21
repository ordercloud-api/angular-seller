angular.module('orderCloud')
    .controller('ProductImagesCtrl', ProductImagesController)
;

function ProductImagesController(OrderCloudSDK, SelectedProduct, toastr, $state, $exceptionHandler, ocImagesModal) {
    var vm = this;
    vm.model = angular.copy(SelectedProduct);
    if (!vm.defaultImage) vm.model.xp.imageZoom = false;

    vm.fileUploadOptions = {
        keyname: 'additionalImages',
        srcKeyname: 'URL',
        folder: null,
        extensions: 'jpg, png, gif, jpeg, tiff',
        invalidExtensions: null,
        onUpdate: patchImage,
        multiple: true,
        draggable: true,
        addText: 'Upload an image',
        replaceText: 'Replace'
    };

    vm.openImageModal = openImageModal;
    vm.toggleZoom = toggleZoom;
    
    function openImageModal(index) {
        if(vm.model.xp.imageZoom) {
            ocImagesModal.Open(vm.model.xp.image, index);
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
            $state.go('.', {}, {reload: 'product', notify:false});
        })
        .catch(function(ex) {
            $exceptionHandler(ex);
        });
    }
}