angular.module('orderCloud')
    .factory('ocImagesModal', ocImagesModalFactory)
    .controller('ProductImagesModalCtrl', ProductImagesModalCtrl)
;

function ocImagesModalFactory($uibModal) {
    var service = {
        Open: _open
    }

    function _open(model, index) {
        $uibModal.open({
            animation: true,
            backdrop: true,
            templateUrl: 'productManagement/images/templates/productImages.modal.html',
            controller: 'ProductImagesModalCtrl',
            controllerAs: 'productImagesModal',
            size: 'large',
            resolve: {
                Model: function() {
                    return model; 
                },
                Index: function() {
                    return index;
                }
            }}).result;
    }

    return service;
}

function ProductImagesModalCtrl(Model, Index, $uibModalInstance) {
    var vm = this;
    vm.additionalImages;
    vm.defaultImage;
    Model.length ? vm.additionalImages = Model : vm.defaultImage = Model;
    vm.index = Index;
    vm.interval = null;
    vm.noWrap = false;

    vm.close = close;

    function close() {
        $uibModalInstance.dismiss();
    }
}