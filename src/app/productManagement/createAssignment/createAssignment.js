angular.module('orderCloud')
    .config(ProductAssignmentConfig)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)
;

function ProductAssignmentConfig($stateProvider) {
    $stateProvider

        .state('products.createAssignment', {
            url: '/:productid/assignments/new?fromstate',
            templateUrl: 'productManagement/createAssignment/templates/createAssignment.html',
            controller: 'ProductCreateAssignmentCtrl',
            controllerAs: 'productCreateAssignment',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                PriceScheduleList: function(OrderCloud) {
                    return OrderCloud.PriceSchedules.List(null,1, 2);
                },
                Buyers: function(OrderCloud){
                    return OrderCloud.Buyers.List();
                },
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                }

            }
        });
}


function ProductCreateAssignmentController($q, $stateParams, $state, toastr, OrderCloud, PriceScheduleList, Assignments, SelectedProduct, Buyers, ProductManagementModal) {
    var vm = this;

    vm.assignBuyer = false;
    vm.assignments =  Assignments;
    vm.buyers = Buyers;
    vm.fromState = $stateParams.fromstate;
    vm.model = {};
    vm.model.ProductID = $stateParams.productid;
    vm.model.BuyerID = vm.selectedBuyer;
    vm.model.UserGroupID =  null;
    vm.model.PriceScheduleID =  null;
    vm.priceSchedules = PriceScheduleList.Items;
    vm.product = SelectedProduct;
    vm.productsAssignedToPriceSchedule = [];
    vm.selectedPriceSchedules = [];

    //functions
    vm.createPriceSchedule = createPriceSchedule;
    vm.deleteAssignment = deleteAssignment;
    vm.editPriceSchedule = editPriceSchedule;
    vm.getUserList = getUserList;
    vm.pageChanged = pageChanged;
    vm.saveAssignment = saveAssignment;
    vm.searchPriceSchedule = searchPriceSchedule;



    function createPriceSchedule(){
        ProductManagementModal.CreatePriceSchedule()
            .then(function(data){
                vm.selectedPriceSchedule = data;
                console.log("this is return from price schedule create",data, vm.selectedPriceSchedule)
            });

    }

    function deleteAssignment(scope) {
        OrderCloud.Products.DeleteAssignment(scope.assignment.ProductID, null, scope.assignment.UserGroupID)
            .then(function() {
                $state.reload();
                toastr.success('Product Assignment Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    function editPriceSchedule(priceSchedule){

        ProductManagementModal.EditPriceSchedule(priceSchedule)
            .then(function(data){
                angular.forEach(vm.priceSchedules.Items, function(priceSchedule,index){
                    if(priceSchedule.ID == data.ID){
                        vm.priceSchedules.Items[index] = data;
                        vm.selectedPriceSchedule = data;
                    }
                });
            })
    };

    function getUserList(buyer){
        vm.selectedUserGroups = null;
        vm.model.BuyerID = buyer.ID;
        OrderCloud.UserGroups.List(null, 1, 20, null, null, null, buyer.ID)
            .then(function(data){
                vm.list = data;
            })
        OrderCloud.Products.ListAssignments($stateParams.productid, null, null, null, null, null, null, buyer.ID)
            .then(function(data){
                console.log("assignments after buyer is selected",data);
                vm.assignments = data;
            })
    };

    function saveAssignment() {

        // if (!(vm.StandardPriceScheduleID || vm.ReplenishmentPriceScheduleID) || (!vm.assignBuyer && !vm.selectedUserGroups.length)) return;
        if (vm.selectedBuyer && vm.selectedUserGroups) {
            var assignmentQueue = [];
            var df = $q.defer();
            angular.forEach(vm.selectedUserGroups, function (group) {
                // angular.forEach(vm.selectedPriceSchedules, function (priceSchedule) {
                var assignment = angular.copy(vm.model);
                assignment.UserGroupID = group.ID;
                assignment.PriceScheduleID = vm.selectedPriceSchedule.ID;
                assignmentQueue.push(OrderCloud.Products.SaveAssignment(assignment));
                // });
            })
            $q.all(assignmentQueue)
                .then(function () {
                    df.resolve();
                    toastr.success('Assignment Updated', 'Success');
                    $state.go('.',{},{reload: true});
                })
                .catch(function (error) {
                    toastr.error('An error occurred while trying to save your product assignment', 'Error');
                })
            return df.promise;

        } else {

            var assignmentQueue = [];
            var df = $q.defer();
            var assignment = angular.copy(vm.model);
            assignment.PriceScheduleID = vm.selectedPriceSchedule.ID;
            assignmentQueue.push(OrderCloud.Products.SaveAssignment(assignment));

            $q.all(assignmentQueue)
                .then(function () {
                    df.resolve();
                    // vm.makeAnotherAssignment ? $state.go('.',{},{reload: true}) :( (vm.fromState == "productCreate") ?  $state.go('products', {}, {reload: true}) : $state.go('products.detail',{productid: vm.product.ID}, {reload: true}) );
                    toastr.success('Assignment Updated', 'Success');
                    $state.go('.',{},{reload: true})
                })
                .catch(function (error) {
                    toastr.error('An error occurred while trying to save your product assignment', 'Error');
                })
            return df.promise;
        }
    };

    function searchPriceSchedule(search){
        if (search == null || ""){
            return;
        }else{
            return OrderCloud.PriceSchedules.List(search, null, 10)
                .then(function(data){
                    vm.priceSchedules= data
                });
        }

    }

    //Reload the state with the incremented page parameter
    function pageChanged() {
        $state.go('.', {page:vm.assignments.Meta.Page});
    };





}

