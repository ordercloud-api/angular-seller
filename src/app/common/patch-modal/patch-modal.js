angular.module('orderCloud')
    .factory('ocPatchModal', ocPatchModal)
    .controller('ocPatchModalCtrl', ocPatchModalController)
;

function ocPatchModal($uibModal, $q) {
    var service = {
        Edit: _edit
    };

    /**
        model: full model of OrderCloud object. Ex: a full Address model
        properties: array of objects. Ex: [{Key: 'FirstName', Label: 'First Name', Required: true]]
        resourceName: name of SDK Resource. Ex: Addresses
        patchFn: SDK Patch function with all params. Wrap in fn(partial) for promise.
            Ex: function(partial) { return OrderCloud.Addresses.Patch('123', partial, 'Buyer1') }
    **/
    function _edit(model, properties, resourceName, patchFn) {
        var deferred = $q.defer();

        var modalInstance = $uibModal.open({
            templateUrl: 'common/patch-modal/templates/patch-modal.html',
            size: 'md',
            controller: 'ocPatchModalCtrl',
            controllerAs: 'patchModal',
            resolve: {
                Model: function() {
                    return model;
                },
                Properties: function() {
                    return properties;
                },
                ResourceName: function() {
                    return resourceName;
                },
                PatchFn: function() {
                    return patchFn;
                }
            }
        });

        modalInstance.result.then(function(result) {
            deferred.resolve(result);
        });

        return deferred.promise;
    }

    return service;
}

function ocPatchModalController($uibModalInstance, Model, Properties, ResourceName, PatchFn, OrderCloud) {
    var vm = this;
    vm.model = angular.copy(Model);
    vm.properties = Properties;

    vm.confirm = function() {
        vm.loading = {
            message: 'Saving...'
        };
        var partial = _.pick(vm.model, _.pluck(vm.properties, 'Key'));
        vm.loading.promise = PatchFn(partial)
            .then(function(data) {
                $uibModalInstance.close(data);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}