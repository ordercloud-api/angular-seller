angular.module('orderCloud')
    .factory('CategoryModalFactory', CategoryModalFactory)
    .controller('CreateCategoryModalCtrl', CreateCategoryModalController)
    .controller('EditCategoryModalCtrl', EditCategoryModalController);

function CategoryModalFactory($state, $exceptionHandler, OrderCloud, OrderCloudConfirm, $uibModal) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete
    };

    function _create(parentid, catalogid) {
        $uibModal.open({
            templateUrl: 'catalogManagement/categoryModalFactory/templates/create.html',
            controller: 'CreateCategoryModalCtrl',
            controllerAs: 'createCategory',
            size: 'md',
            resolve: {
                ParentID: function() {
                    return parentid;
                },
                CatalogID: function() {
                    return catalogid;
                }
            }
        }).result;
    }

    function _edit(categoryid, catalogid) {
        $uibModal.open({
            templateUrl: 'catalogManagement/categoryModalFactory/templates/edit.html',
            controller: 'EditCategoryModalCtrl',
            controllerAs: 'editCategory',
            size: 'md',
            resolve: {
                SelectedCategory: function(OrderCloud) {
                    return OrderCloud.Categories.Get(categoryid, catalogid);
                },
                CatalogID: function() {
                    return catalogid;
                }
            }
        }).result;
    }

    function _delete(id, catalogid) {
        OrderCloudConfirm.Confirm('Are you sure you want to delete this category?')
            .then(function() {
                OrderCloud.Categories.Delete(id, catalogid)
                    .then(function() {
                        //TODO: replace state reload with something less resource intensive
                        $state.go('catalogManagement', {buyerID: catalogid, activeTab: 2}, {reload:true});
                    })
                    .catch(function(err){
                        $exceptionHandler(err);
                    });
            });
    }
    return service;
}

function CreateCategoryModalController($state, $exceptionHandler, $uibModalInstance, OrderCloud, ParentID, CatalogID){
    var vm = this;
    vm.category = {};
    vm.category.ParentID = ParentID;
    vm.category.Active = true;
    vm.catalogid = CatalogID;

    vm.cancel = function(){
        $uibModalInstance.dismiss();
    };

    vm.submit = function() {
        if (vm.category.ParentID === '') {
            vm.category.ParentID = null;
        }
        vm.loading = {
            templateUrl:'common/loading-indicators/templates/view.loading.tpl.html',
            message:'Creating Category'
        };
        vm.loading.promise = OrderCloud.Categories.Create(vm.category, vm.catalogid)
            .then(function(category) {
                $uibModalInstance.close(category);
                //TODO: replace state reload with something less resource intensive
                $state.go('catalogManagement', {buyerID: vm.catalogid, activeTab: 2}, {reload:true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function EditCategoryModalController($state, $exceptionHandler, $uibModalInstance, OrderCloud, SelectedCategory, CatalogID){
    var vm = this,
    originalcategoryID = angular.copy(SelectedCategory.ID);
    vm.category = SelectedCategory;
    vm.catalogid = CatalogID;

    vm.cancel = function(){
        $uibModalInstance.dismiss();
    };

    vm.submit = function() {
        if (vm.category.ParentID === '') {
            vm.category.ParentID = null;
        }
        vm.loading = {
            templateUrl:'common/loading-indicators/templates/view.loading.tpl.html',
            message:'Updating Category'
        };
        vm.loading.promise = OrderCloud.Categories.Update(originalcategoryID, vm.category, vm.catalogid)
            .then(function(category) {
                $uibModalInstance.close(category);
                //TODO: replace state reload with something less resource intensive
                $state.go('catalogManagement', {buyerID: vm.catalogid, activeTab: 2}, {reload:true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

}