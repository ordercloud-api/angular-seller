angular.module('orderCloud')
    .controller('ProductSpecsCtrl', ProductSpecsController)
    .controller('ProductSpecCreateCtrl', ProductSpecCreateController)
;

function ProductSpecsController($rootScope, toastr, ocProductSpecs, ProductSpecs) {
    var vm = this;
    vm.specs = angular.copy(ProductSpecs);
    vm.selectedSpec = null;
    vm.createSpec = createSpec;
    vm.editSelectedSpec = editSelectedSpec;
    vm.deleteSelectedSpec = deleteSelectedSpec;
    vm.specSelected = specSelected;
    vm.createSpecOption = createSpecOption;
    vm.editSpecOption = editSpecOption;
    vm.deleteSpecOption = deleteSpecOption;

    vm.specTreeOptions = {
        dropped: function(event) {
            ocProductSpecs.UpdateSpecListOrder(event)
                .then(function() {
                    vm.selectedSpec = null;
                });
        }
    };

    vm.specOptionsTreeOptions = {
        dropped: function(event) {
            ocProductSpecs.UpdateSpecOptionsListOrder(event, vm.selectedSpec.Spec.ID);
        }
    };

    function createSpec(productID) {
        ocProductSpecs.CreateSpec(productID)
            .then(function(assignment) {
                vm.specs.Items.push(assignment);
                vm.selectedSpec = assignment;
                $rootScope.$broadcast('ProductManagement:SpecCountChanged', 'increment');
            });
    }

    function editSelectedSpec() {
        ocProductSpecs.EditSpec(vm.selectedSpec.Spec)
            .then(function(updatedSpec) {
                vm.specs.Items[_.indexOf(vm.specs.Items, vm.selectedSpec)].Spec = updatedSpec;
                vm.specs.Items[_.indexOf(vm.specs.Items, vm.selectedSpec)].SpecID = updatedSpec.ID;
                vm.selectedSpec.Spec = updatedSpec;
                toastr.success('Spec: ' + vm.selectedSpec.Spec.Name + ' was updated.');
            });
    }

    function deleteSelectedSpec() {
        ocProductSpecs.DeleteSpec(vm.selectedSpec.Spec.ID)
            .then(function() {
                var specIndex = 0;
                angular.forEach(vm.specs.Items, function(spec, index) {
                    if (spec.Spec.ID == vm.selectedSpec.Spec.ID) {
                        specIndex = index;
                    }
                });
                vm.specs.Items.splice(specIndex, 1);
                toastr.success('Spec: ' + vm.selectedSpec.Spec.Name + ' was deleted.');
                vm.selectedSpec = null;
                $rootScope.$broadcast('ProductManagement:SpecCountChanged', 'decrement');
            });
    }

    function specSelected(node) {
        //Spec data is located on node.Spec
        //Assignment data (including DefaultValue and DefaultOptionID) is located on node
        vm.selectedSpec = node;
    }

    function createSpecOption() {
        ocProductSpecs.CreateSpecOption(vm.selectedSpec)
            .then(function(specOption) {
                if (vm.selectedSpec.Options) {
                    vm.selectedSpec.Options.push(specOption);
                } else {
                    vm.selectedSpec.Options = [specOption];
                }
                angular.forEach(vm.selectedSpec.Options, function(option, index) {
                    if (option.ID != specOption.ID) {
                        vm.selectedSpec.Options[index].DefaultOption = specOption.DefaultOption ? false : option.DefaultOption;
                    }
                });
                toastr.success('Spec option ' + specOption.Value + ' was created.');
            });
    }

    function editSpecOption(node) {
        ocProductSpecs.EditSpecOption(vm.selectedSpec, node)
            .then(function(specOption) {
                angular.forEach(vm.selectedSpec.Options, function(option, index) {
                    if (option.ID == specOption.OriginalID) {
                        vm.selectedSpec.Options[index] = specOption;
                    }
                    else {
                        vm.selectedSpec.Options[index].DefaultOption = specOption.DefaultOption ? false : option.DefaultOption;
                    }
                });
                toastr.success('Spec option ' + specOption.Value + ' was updated.');
            });
    }


    function deleteSpecOption(node) {
        ocProductSpecs.DeleteSpecOption(vm.selectedSpec.Spec.ID, node.ID)
            .then(function() {
                var specOptionIndex = 0;
                angular.forEach(vm.selectedSpec.Options, function(option, index) {
                    if (option.ID == node.ID) {
                        specOptionIndex = index;
                    }
                });
                toastr.success('Spec option: ' + node.Value + ' was deleted.');
                vm.selectedSpec.Options.splice(specOptionIndex, 1);
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
                        toastr.success('Spec: ' + data.Name + ' created');
                        $uibModalInstance.close(assignment);
                    });
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}
