angular.module('orderCloud')
    .controller('EditCategoryModalCtrl', EditCategoryModalController)
;

function EditCategoryModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, SelectedCategory, CatalogID){
    var vm = this;
    vm.category = angular.copy(SelectedCategory);
    if (!vm.category.xp) vm.category.xp = {};
    vm.categoryName = SelectedCategory.Name;
    vm.catalogid = CatalogID;

    vm.fileUploadOptions = {
        keyname: 'image',
        extensions: 'jpg, png, gif, jpeg, tiff',
        uploadText: 'Upload an image',
        replaceText: 'Replace image',
        onUpdate: updateImage
    };

    function updateImage(imageXP){
        angular.extend(vm.category.xp, imageXP);
    }

    vm.cancel = function(){
        $uibModalInstance.dismiss();
    };

    vm.submit = function() {
        if (vm.category.ParentID === '') {
            vm.category.ParentID = null;
        }
        vm.loading = OrderCloudSDK.Categories.Update(vm.catalogid, SelectedCategory.ID, vm.category)
            .then(function(category) {
                $uibModalInstance.close(category);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

}