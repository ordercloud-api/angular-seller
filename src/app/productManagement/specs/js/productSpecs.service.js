angular.module('orderCloud')
    .factory('ocProductSpecs', ocProductsSpecsService)
;

function ocProductsSpecsService($q, $uibModal, OrderCloud) {
    var service = {
        ProductSpecsDetail: _productSpecsDetail,
        UpdateSpecListOrder: _updateSpecListOrder,
        UpdateSpecOptionsListOrder: _updateSpecOptionsListOrder,
        EditSpec: _editSpec
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

    return service;
}