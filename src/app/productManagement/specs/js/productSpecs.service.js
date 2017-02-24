angular.module('orderCloud')
    .factory('ocProductSpecs', ocProductsSpecsService)
;

function ocProductsSpecsService($q, $uibModal, OrderCloud, ocConfirm) {
    var service = {
        ProductSpecsDetail: _productSpecsDetail,
        UpdateSpecListOrder: _updateSpecListOrder,
        UpdateSpecOptionsListOrder: _updateSpecOptionsListOrder,
        CreateSpec: _createSpec,
        EditSpec: _editSpec,
        DeleteSpec: _deleteSpec,
        CreateSpecOption: _createSpecOption,
        EditSpecOption: _editSpecOption,
        DeleteSpecOption: _deleteSpecOption
    };

    function _productSpecsDetail(productid) {
        var deferred = $q.defer();

        OrderCloud.Specs.ListProductAssignments(null, productid, 1, 100)
            .then(function(data) {
                if (data.Items.length) {
                    getSpecs(data);
                } else {
                    deferred.resolve(data);
                }
            });

        function getSpecs(data) {
            OrderCloud.Specs.List(null, null, null, null, null, {ID: _.pluck(data.Items, 'SpecID').join('|')})
                .then(function(details) {
                    getSpecOptions(data, details);
                });
        }

        function getSpecOptions(data, details) {
            var optionQueue = [];
            angular.forEach(data.Items, function(specAssignment) {
                specAssignment.Spec = _.where(details.Items, {ID: specAssignment.SpecID})[0];
                if (specAssignment.Spec && specAssignment.Spec.OptionCount) {
                    //OrderCloud.Specs.ListOptions(specAssignment.Spec.ID, null, 1, 100)
                    optionQueue.push((function() {
                        var d = $q.defer();

                        OrderCloud.Specs.ListOptions(specAssignment.Spec.ID, null, 1, 100)
                            .then(function(oData) {
                                specAssignment.Options = oData.Items;
                                _.map(specAssignment.Options, function(option) { option.DefaultOption = (specAssignment.DefaultOptionID == option.ID) });
                                d.resolve();
                            });

                        return d.promise;
                    })());
                }
            });

            $q.all(optionQueue).then(function() {
                deferred.resolve(data);
            });
        }

        return deferred.promise;
    }

    function _updateSpecListOrder(event) {
        var deferred = $q.defer();
        var nodeList = event.source.nodesScope.$modelValue;
        var queue = [];

        angular.forEach(nodeList, function(node, index) {
            queue.push((function() {
                return OrderCloud.Specs.Patch(node.Spec.ID, {ListOrder: index});
            }));
        });

        var queueIndex = 0;
        function run(i) {
            queue[i]().then(function() {
                queueIndex++;
                if (queueIndex < queue.length) {
                    run(queueIndex);
                }
                else {
                    deferred.resolve();
                }
            });
        }
        run(queueIndex);

        return deferred.promise;
    }

    function _updateSpecOptionsListOrder(event, specID) {
        var deferred = $q.defer();

        var nodeList = event.source.nodesScope.$modelValue;
        var queue = [];

        angular.forEach(nodeList, function(node, index) {
            queue.push((function() {
                return OrderCloud.Specs.PatchOption(specID, node.ID, {ListOrder: index});
            }));
        });

        var queueIndex = 0;
        function run(i) {
            queue[i]().then(function() {
                queueIndex++;
                if (queueIndex < queue.length) {
                    run(queueIndex);
                }
                else {
                    deferred.resolve();
                }
            });
        }
        run(queueIndex);

        return deferred.promise;
    }

    function _createSpec(productID) {
        return $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecCreate.modal.html',
            size: 'md',
            controller: 'ProductSpecCreateCtrl',
            controllerAs: 'productSpecCreate',
            resolve: {
                ProductID: function() {
                    return productID;
                }
            }
        }).result;
    }

    function _editSpec(spec) {
        return $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecEdit.modal.html',
            controller: 'ProductSpecEditModalCtrl',
            controllerAs: 'productSpecEditModal',
            resolve: {
                SelectedSpec: function() {
                    return spec;
                }
            }
        }).result
    }

    function _deleteSpec(specID) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + specID + '</b>?',
                confirmText: 'Delete spec',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Specs.Delete(specID);
            });
    }

    function _createSpecOption(selectedSpec) {
        return $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecOptionCreate.modal.html',
            size: 'md',
            controller: 'ProductSpecOptionCreateCtrl',
            controllerAs: 'productSpecOptionCreate',
            resolve: {
                ProductID: function() {
                    return selectedSpec.ProductID;
                },
                SpecID: function() {
                    return selectedSpec.Spec.ID;
                }
            }
        }).result;
    }

    function _editSpecOption(selectedSpec, node) {
        return $uibModal.open({
            templateUrl: 'productManagement/specs/templates/productSpecOptionEdit.modal.html',
            size: 'md',
            controller: 'ProductSpecOptionEditCtrl',
            controllerAs: 'productSpecOptionEdit',
            resolve: {
                ProductID: function() {
                    return selectedSpec.ProductID;
                },
                SpecID: function() {
                    return selectedSpec.Spec.ID;
                },
                SpecOption: function() {
                    return node;
                }
            }
        }).result;
    }

    function _deleteSpecOption(specID, specOptionID) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + specOptionID + '</b>?',
                confirmText: 'Delete spec option',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Specs.DeleteOption(specID, specOptionID);
            });
    }

    return service;
}