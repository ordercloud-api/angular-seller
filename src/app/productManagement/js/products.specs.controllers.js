angular.module('orderCloud')
    .controller('ProductSpecsCtrl', ProductSpecsController)
    .controller('ProductSpecCreateCtrl', ProductSpecCreateController)
    .controller('ProductSpecOptionCreateCtrl', ProductSpecOptionCreateController)
    .controller('ProductSpecOptionEditCtrl', ProductSpecOptionEditController)
;

function ProductSpecsController($uibModal, ocProductsService, ProductSpecs) {
    var vm = this;
    vm.specs = angular.copy(ProductSpecs);
    vm.selectedSpec = null;
    vm.createSpec = createSpec;
    vm.specSelected = specSelected;
    vm.createSpecOption = createSpecOption;
    vm.specOptionSelected = specOptionSelected;

    vm.specTreeOptions = {
        dropped: function(event) {
            ocProductsService.UpdateSpecListOrder(event);
        }
    };

    vm.specOptionsTreeOptions = {
        dropped: function(event) {
            ocProductsService.UpdateSpecOptionsListOrder(event, vm.selectedSpec.Spec.ID);
        }
    };

    function createSpec(productID) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/productSpecCreate.modal.html',
            size: 'md',
            controller: 'ProductSpecCreateCtrl',
            controllerAs: 'productSpecCreate',
            resolve: {
                ProductID: function() {
                    return productID;
                }
            }
        });

        modalInstance.result.then(function(assignment) {
            vm.specs.Items.push(assignment);
            vm.selectedSpec = assignment;
        });
    }

    function specSelected(node) {
        //Spec data is located on node.Spec
        //Assignment data (including DefaultValue and DefaultOptionID) is located on node
        vm.selectedSpec = node;
    }

    function createSpecOption() {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/productSpecOptionCreate.modal.html',
            size: 'md',
            controller: 'ProductSpecOptionCreateCtrl',
            controllerAs: 'productSpecOptionCreate',
            resolve: {
                ProductID: function() {
                    return vm.selectedSpec.ProductID;
                },
                SpecID: function() {
                    return vm.selectedSpec.Spec.ID;
                }
            }
        });

        modalInstance.result.then(function() {
            //
        });
    }

    function specOptionSelected(node) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/templates/productSpecOptionEdit.modal.html',
            size: 'md',
            controller: 'ProductSpecOptionEditCtrl',
            controllerAs: 'productSpecOptionEdit',
            resolve: {
                ProductID: function() {
                    return vm.selectedSpec.ProductID;
                },
                SpecID: function() {
                    return vm.selectedSpec.Spec.ID;
                },
                SpecOption: function() {
                    return node;
                }
            }
        });

        modalInstance.result.then(function() {
            //
        });
    }
}

function ProductSpecCreateController($uibModalInstance, toastr, OrderCloud, ProductID) {
    var vm = this;

    vm.submit = function() {
        vm.loading = OrderCloud.Specs.Create(vm.spec)
            .then(function(data) {
                OrderCloud.Specs.SaveProductAssignment({ProductID: ProductID, SpecID: data.ID})
                    .then(function(assignment) {
                        assignment.Spec = data;
                        toastr.success(data.Name + ' spec created', 'Success');
                        $uibModalInstance.close(assignment);
                    });
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function ProductSpecOptionCreateController($uibModalInstance, toastr, OrderCloud, ProductID, SpecID) {
    var vm = this;

    vm.submit = function() {

    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function ProductSpecOptionEditController($uibModalInstance, OrderCloud, ProductID, SpecID, SpecOption) {
    var vm = this;
    vm.specOption = SpecOption;

    vm.submit = function() {

    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}