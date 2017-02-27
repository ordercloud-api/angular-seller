angular.module('orderCloud')
    .controller('EditCategoryModalCtrl', EditCategoryModalController)
;

function EditCategoryModalController($exceptionHandler, $uibModalInstance, OrderCloud, SelectedCategory, CatalogID){
    var vm = this;
    vm.category = angular.copy(SelectedCategory);
    vm.categoryName = SelectedCategory.Name;
    vm.catalogid = CatalogID;
    vm.patchImage = patchImage;

    function patchImage(imageXP){
        return OrderCloud.Categories.Patch(vm.category.ID, {xp: imageXP});
    }

    vm.cancel = function(){
        $uibModalInstance.dismiss();
    };

    vm.submit = function() {
        if (vm.category.ParentID === '') {
            vm.category.ParentID = null;
        }
        vm.loading = OrderCloud.Categories.Update(SelectedCategory.ID, vm.category, vm.catalogid)
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