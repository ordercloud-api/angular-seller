angular.module('orderCloud')
    .directive('ocProductImages', ocProductImages)
    .controller('ProductImagesModalCtrl', ProductImagesModalCtrl)
;

function ocProductImages() {
    return {
        scope: {
            product: '=',
            fileUploadOptions: '<'
        },
        restrict: 'E',
        templateUrl: 'productManagement/images/templates/productImagesCarousel.html',
        controller: function($scope, $timeout, $uibModal, $exceptionHandler, $state, toastr, OrderCloudSDK) {

            var slickMainOpts = {
                arrows: true,
                infinite: false,
                slidesToShow: 1,
                slidesToScroll: 1,
                fade: true
            };

            $scope.carouselLoading = $timeout(function() {
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
                    exceptionHandler(ex);
                })
            }

            $scope.openImageModal = function(index) {
                if($scope.product.xp.imageZoom) {
                    return $uibModal.open({
                    animation: true,
                    backdrop: true,
                    templateUrl: 'productDetail/templates/productDetail.images.modal.html',
                    controller: 'ProductImagesModalCtrl',
                    controllerAs: 'productImagesModal',
                    size: 'large',
                    resolve: {
                        Product: function() {
                            return $scope.product; 
                        },
                        Index: function() {
                            return index;
                        }
                    }}).result;
                }
            }
        }
    }
}

function ProductImagesModalCtrl(Product, Index, $uibModalInstance) {
    var vm = this;
    vm.product = Product;
    vm.index = Index;
    vm.images = vm.product.xp.additionalImages;
    vm.interval = null;
    vm.noWrap = false;

    vm.close = close;

    function close() {
        $uibModalInstance.dismiss();
    }
}