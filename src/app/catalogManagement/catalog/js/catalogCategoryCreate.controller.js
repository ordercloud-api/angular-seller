angular.module('orderCloud')
    .controller('CreateCategoryModalCtrl', CreateCategoryModalController)
;

function CreateCategoryModalController($exceptionHandler, $uibModalInstance, OrderCloud, ParentID, CatalogID){
    var vm = this;
    vm.category = {};
    vm.category.ParentID = ParentID;
    vm.category.Active = true;
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
        vm.loading = OrderCloud.Categories.Create(vm.category, vm.catalogid)
            .then(function(category) {
                $uibModalInstance.close(category);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}