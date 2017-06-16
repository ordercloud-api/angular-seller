angular.module('orderCloud')
    .directive('ocAdditionalImages', ocAdditionalImages)
;

function ocAdditionalImages() {
    return {
        scope: {
            product: '=',
            fileUploadOptions: '<'
        },
        restrict: 'E',
        templateUrl: 'productManagement/images/templates/productImagesCarousel.html',
        controller: function($scope, $timeout, $uibModal, $exceptionHandler, $state, toastr, OrderCloudSDK, ocImagesModal) {

            var slickMainOpts = {
                arrows: true,
                infinite: false,
                slidesToShow: 1,
                slidesToScroll: 1,
                fade: true
            };

            $scope.carouselLoading = $timeout(function() {
                if (!$scope.product.xp.additionalImages) $scope.product.xp.additionalImages = [];
                var slickMain = $('#ImageMain');
                slickMain.slick(slickMainOpts);

                $scope.fileUploadOptions = {
                    keyname: 'additionalImages',
                    srcKeyname: 'URL',
                    folder: null,
                    extensions: 'jpg, png, gif, jpeg, tiff',
                    invalidExtensions: null,
                    onUpdate: patchImage,
                    multiple: true,
                    addText: 'Upload an image',
                    replaceText: 'Replace'
                };
            }, 300);

            
            function patchImage(imageXP) {
                return OrderCloudSDK.Products.Patch($scope.product.ID, {
                    xp: imageXP
                })
                .then(function() {
                    toastr.success('Images successfully updated', 'Success');
                    $state.go('product.images', {productid: $scope.product.ID}, {reload: true});
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
            }

            $scope.openImageModal = function(index) {
                if($scope.product.xp.imageZoom) {
                    ocImagesModal.Open($scope.product.xp.additionalImages, index);
                }
            };
        }
    };
}