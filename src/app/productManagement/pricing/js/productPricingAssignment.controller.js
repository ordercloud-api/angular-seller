angular.module('orderCloud')
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)
    .controller('PriceScheduleCreateAssignmentCtrl', PriceScheduleCreateAssignmentController)
;

function ProductCreateAssignmentController($state, toastr, OrderCloud, ocProductPricing, SelectedProduct, Buyers) {
    var vm = this;
    vm.buyers = Buyers;
    vm.product = SelectedProduct;
    vm.selectedBuyer = null;
    vm.priceSchedule = {
        RestrictedQuantity: false,
        PriceBreaks: [],
        MinQuantity: 1,
        OrderType: 'Standard'
    };

    vm.getBuyerUserGroups = getBuyerUserGroups;
    vm.saveAssignment = saveAssignment;
    vm.addPriceBreak = addPriceBreak;
    vm.deletePriceBreak = deletePriceBreak;
    vm.assignAtUserGroupLevel = false;

    function addPriceBreak() {
        var numberExist = _.findWhere(vm.priceSchedule.PriceBreaks, {Quantity: vm.quantity});
        if (vm.quantity > vm.priceSchedule.MaxQuantity) {
            toastr.error('Max quantity exceeded','Error');
        } else {
            numberExist === undefined
                ? vm.priceSchedule.PriceBreaks.push({Price: vm.price, Quantity: vm.quantity})
                : toastr.error('Quantity already exists. Please delete and re-enter quantity and price to edit', 'Error');
        }
        ocProductPricing.PriceBreaks.DisplayQuantity(vm.priceSchedule);
        vm.priceSchedule = ocProductPricing.PriceBreaks.SetMinMax(vm.priceSchedule);
        vm.quantity = null;
        vm.price = null;
    }

    function deletePriceBreak(index) {
        vm.priceSchedule.PriceBreaks.splice(index, 1);
        vm.priceSchedule = ocProductPricing.PriceBreaks.SetMinMax(vm.priceSchedule);
    }

    function getBuyerUserGroups(){
        vm.selectedUserGroups = null;
        OrderCloud.UserGroups.List(null, 1, 20, null, null, null, vm.selectedBuyer.ID)
            .then(function(data){
                vm.buyerUserGroups = data;
            });
    }

    function saveAssignment() {
        ocProductPricing.CreatePrice(vm.product, vm.priceSchedule, vm.selectedBuyer, vm.selectedUserGroups)
            .then(function(data) {
                toastr.success(vm.priceSchedule.ID + 'was created.');
                $state.go('^.pricing', {pricescheduleid:data.PriceScheduleID});
            })
            .catch(function (ex) {
                toastr.error('An error occurred while trying to save your product assignment', 'Error');
            });
    }
}

function PriceScheduleCreateAssignmentController($uibModalInstance, $stateParams, OrderCloud, Buyers, SelectedBuyer, BuyerUserGroups, SelectedPrice, AssignedUserGroups) {
    var vm = this;

    vm.buyers = {Items: []};
    vm.selectedBuyer = SelectedBuyer;
    vm.preSelectedBuyer = SelectedBuyer != null;
    vm.buyerUserGroups = {Items: []};
    vm.assignAtUserGroupLevel = vm.preSelectedBuyer;

    var assignedBuyerIDs = _.pluck(SelectedPrice.Availability, 'ID');
    if (vm.preSelectedBuyer) {
        vm.buyers = Buyers;
    }
    else {
        angular.forEach(Buyers.Items, function(buyer) {
            if (assignedBuyerIDs.indexOf(buyer.ID) == -1) {
                vm.buyers.Items.push(buyer);
            }
        });
    }

    var assignedUserGroupIDs = _.pluck(AssignedUserGroups, 'ID');
    if (BuyerUserGroups) {
        angular.forEach(BuyerUserGroups.Items, function(userGroup) {
            if (assignedUserGroupIDs.indexOf(userGroup.ID) == -1) {
                vm.buyerUserGroups.Items.push(userGroup);
            }
        });
    }

    vm.getBuyerUserGroups = function() {
        console.log(vm.selectedBuyer);
        OrderCloud.UserGroups.List(null, 1, 20, null, null, null, vm.selectedBuyer.ID)
            .then(function(data) {
                vm.buyerUserGroups = data;
            });
    };

    vm.submit = function() {
        if (vm.selectedBuyer.Assigned && vm.selectedUserGroup) {
            OrderCloud.Products.DeleteAssignment($stateParams.productid, null, null, vm.selectedBuyer.ID)
                .then(function() {
                    saveAssignment();
                })
        } else {
            saveAssignment();
        }

        function saveAssignment() {
            var assignment = {
                ProductID: $stateParams.productid,
                PriceScheduleID: SelectedPrice.PriceSchedule.ID,
                BuyerID: vm.selectedBuyer.ID
            };
            if (vm.selectedUserGroup) assignment.UserGroupID = vm.selectedUserGroup.ID;
            OrderCloud.Products.SaveAssignment(assignment)
                .then(function(data) {
                    data.Buyer = vm.selectedBuyer;
                    data.UserGroup = vm.selectedUserGroup;
                    $uibModalInstance.close(data);
                });
        }
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}