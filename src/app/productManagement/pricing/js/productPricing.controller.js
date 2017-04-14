angular.module('orderCloud')
    .controller('ProductPricingCtrl', ProductPricingController)
;

function ProductPricingController($q, $rootScope, $stateParams, $uibModal, toastr, AssignmentList, AssignmentData, ocProductPricing, ocConfirm, SelectedProduct) {
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;
    var isDefault;

    vm.noPricesSet = !_.keys(vm.listAssignments).length;
    vm.noOverridesSet = _.keys(vm.listAssignments).length === 1 && SelectedProduct.DefaultPriceScheduleID;

    vm.selectPrice = function (scope) {
        vm.loadingPrice = ocProductPricing.AssignmentDataDetail(vm.listAssignments, scope.assignment.PriceSchedule.ID)
            .then(function (data) {
                vm.selectedPrice = scope.assignment;
                vm.selectedPrice.PriceSchedule = data.PriceSchedule;
                vm.selectedPrice.Availability = data.Buyers;
                isDefault = SelectedProduct.DefaultPriceScheduleID === data.PriceSchedule.ID;
            });
    };

    if (SelectedProduct.DefaultPriceScheduleID && !$stateParams.pricescheduleid) {
        vm.selectPrice({
            assignment: vm.listAssignments[SelectedProduct.DefaultPriceScheduleID]
        });
    } else if ($stateParams.pricescheduleid && vm.listAssignments[$stateParams.pricescheduleid]) {
        vm.selectPrice({
            assignment: vm.listAssignments[$stateParams.pricescheduleid]
        });
    } else if (_.keys(vm.listAssignments).length) {
        vm.selectPrice({
            assignment: vm.listAssignments[_.keys(vm.listAssignments)[0]]
        });
    }

    vm.editPrice = function () {
        ocProductPricing.EditProductPrice(vm.selectedPrice.PriceSchedule, isDefault)
            .then(function (updatedPriceSchedule) {
                if (isDefault && updatedPriceSchedule.ID !== vm.selectedPrice.PriceSchedule.ID) $rootScope.$broadcast('OC:DefaultPriceUpdated', updatedPriceSchedule.ID);
                var oldAssignment = angular.copy(vm.listAssignments[vm.selectedPrice.PriceSchedule.ID]);
                oldAssignment.PriceSchedule = updatedPriceSchedule;
                oldAssignment.PriceScheduleID = updatedPriceSchedule.ID;

                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];

                vm.listAssignments[updatedPriceSchedule.ID] = oldAssignment;
                vm.selectedPrice = oldAssignment;
                vm.selectedPrice.PriceSchedule = updatedPriceSchedule;
                toastr.success(vm.selectedPrice.PriceSchedule.Name + ' was updated.');
            });
    };

    vm.deletePrice = function () {
        ocProductPricing.DeletePrice(vm.selectedPrice.PriceSchedule)
            .then(function () {
                delete vm.listAssignments[vm.selectedPrice.PriceSchedule.ID];
                vm.noPricesSet = _.keys(vm.listAssignments).length === 0;
                toastr.success(vm.selectedPrice.PriceSchedule.Name + ' was deleted');
                vm.selectedPrice = null;
            });
    };
}