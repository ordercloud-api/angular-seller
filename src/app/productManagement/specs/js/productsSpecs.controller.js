angular.module('orderCloud')
    .controller('ProductSpecsCtrl', ProductSpecsController)
    .controller('ProductSpecCreateCtrl', ProductSpecCreateController)
    .controller('ProductSpecOptionCreateCtrl', ProductSpecOptionCreateController)
    .controller('ProductSpecOptionEditCtrl', ProductSpecOptionEditController)
;

function ProductSpecsController($rootScope, $uibModal, toastr, ocConfirm, OrderCloud, ocProductSpecs, ProductSpecs) {
    var vm = this;
    vm.specs = angular.copy(ProductSpecs);
    vm.selectedSpec = null;
    vm.createSpec = createSpec;
    vm.editSelectedSpec = editSelectedSpec;
    vm.deleteSelectedSpec = deleteSelectedSpec;
    vm.specSelected = specSelected;
    vm.createSpecOption = createSpecOption;
    vm.specOptionSelected = specOptionSelected;
    vm.deleteSpecOption = deleteSpecOption;

    vm.specTreeOptions = {
        dropped: function(event) {
            ocProductSpecs.UpdateSpecListOrder(event)
                .then(function() {
                    vm.selectedSpec = null;
                })
        }
    };

    vm.specOptionsTreeOptions = {
        dropped: function(event) {
            ocProductSpecs.UpdateSpecOptionsListOrder(event, vm.selectedSpec.Spec.ID);
        }
    };

    function createSpec(productID) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecCreate.modal.html',
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
            $rootScope.$broadcast('ProductManagement:SpecCountChanged', 'increment');
        });
    }

    function editSelectedSpec() {
        ocProductSpecs.EditSpec(vm.selectedSpec.Spec)
            .then(function(updatedSpec) {
                vm.specs.Items[_.indexOf(vm.specs.Items, vm.selectedSpec)].Spec = updatedSpec;
                vm.specs.Items[_.indexOf(vm.specs.Items, vm.selectedSpec)].SpecID = updatedSpec.ID;
                vm.selectedSpec.Spec = updatedSpec;
                toastr.success(vm.selectedSpec.Spec.Name + ' was updated.', 'Success!');
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
                vm.selectedSpec = null;
                $rootScope.$broadcast('ProductManagement:SpecCountChanged', 'decrement');
                toastr.success('Spec was deleted.', 'Success!');
            });
    }

    function specSelected(node) {
        //Spec data is located on node.Spec
        //Assignment data (including DefaultValue and DefaultOptionID) is located on node
        vm.selectedSpec = node;
    }

    function createSpecOption() {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecOptionCreate.modal.html',
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

        modalInstance.result.then(function(specOption) {
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
            toastr.success('Spec option ' + specOption.Value + ' was created.', 'Success!');
        });
    }

    function specOptionSelected(node) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecOptionEdit.modal.html',
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

        modalInstance.result.then(function(specOption) {
            angular.forEach(vm.selectedSpec.Options, function(option, index) {
                if (option.ID == specOption.OriginalID) {
                    vm.selectedSpec.Options[index] = specOption;
                }
                else {
                    vm.selectedSpec.Options[index].DefaultOption = specOption.DefaultOption ? false : option.DefaultOption;
                }
            });
            toastr.success('Spec option ' + specOption.Value + ' was updated.', 'Success!');
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
                vm.selectedSpec.Options.splice(specOptionIndex, 1);
                toastr.success('Spec option was deleted.', 'Success!');
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

function ProductSpecOptionCreateController($uibModalInstance, OrderCloud, ProductID, SpecID) {
    var vm = this;
    vm.markupTypes = [
        {Label: 'None', Value: 'NoMarkup'},
        {Label: 'Fixed amount per unit', Value: 'AmountPerQuantity'},
        {Label: 'Fixed amount per line item', Value: 'AmountTotal'},
        {Label: 'Percentage of line total', Value: 'Percentage'}
    ];

    vm.specOption = {
        PriceMarkupType: 'NoMarkup'
    };

    vm.submit = function() {
        vm.loading = OrderCloud.Specs.CreateOption(SpecID, vm.specOption)
            .then(function(data) {
                if (vm.specOption.DefaultOption) {
                    return OrderCloud.Specs.SaveProductAssignment({ProductID: ProductID, SpecID: SpecID, DefaultOptionID: data.ID})
                        .then(function() {
                            data.DefaultOption = true;
                            $uibModalInstance.close(data);
                        });
                }
                else {
                    data.DefaultOption = false;
                    $uibModalInstance.close(data);
                }
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function ProductSpecOptionEditController($uibModalInstance, OrderCloud, ProductID, SpecID, SpecOption) {
    var vm = this;
    vm.specOption = angular.copy(SpecOption);
    vm.specOptionValue = angular.copy(SpecOption.Value);
    vm.markupTypes = [
        {Label: 'None', Value: 'NoMarkup'},
        {Label: 'Fixed amount per unit', Value: 'AmountPerQuantity'},
        {Label: 'Fixed amount per line item', Value: 'AmountTotal'},
        {Label: 'Percentage of line total', Value: 'Percentage'}
    ];

    vm.submit = function() {
        var partial = _.pick(vm.specOption, ['ID', 'Value', 'IsOpenText', 'PriceMarkupType', 'PriceMarkup']);
        vm.loading = OrderCloud.Specs.PatchOption(SpecID, SpecOption.ID, partial)
            .then(function(data) {
                if (vm.specOption.DefaultOption && (vm.specOption.DefaultOption != SpecOption.DefaultOption)) {
                    return OrderCloud.Specs.SaveProductAssignment({ProductID: ProductID, SpecID: SpecID, DefaultOptionID: data.ID})
                        .then(function() {
                            data.DefaultOption = true;
                            data.OriginalID = SpecOption.ID;
                            $uibModalInstance.close(data);
                        });
                }
                else {
                    data.DefaultOption = vm.specOption.DefaultOption;
                    data.OriginalID = SpecOption.ID;
                    $uibModalInstance.close(data);
                }
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}