angular.module('orderCloud')
    .controller('EditCategoryModalCtrl', EditCategoryModalController)
;

function EditCategoryModalController($exceptionHandler, $uibModalInstance, OrderCloudSDK, SelectedCategory, CatalogID){
    var vm = this;
    vm.category = angular.copy(SelectedCategory);
    vm.categoryName = SelectedCategory.Name;
    vm.catalogid = CatalogID;
    vm.patchImage = patchImage;

    function patchImage(imageXP){
        return OrderCloudSDK.Categories.Patch(CatalogID, vm.category.ID, {xp: imageXP});
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

                //TODO: replace state reload with something less resource intensive
                //$state.go('catalogManagement', {buyerID: vm.catalogid, activeTab: 2}, {reload:true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}