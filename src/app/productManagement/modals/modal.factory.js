angular.module('orderCloud')
    .factory('ProductManagementModal', ProductManagementModalFactory)
    .controller('CreateAssignmentModalCtrl', CreateAssignmentModalController)
    .controller('CreatePriceScheduleModalCtrl', CreatePriceScheduleModalController)
    .controller('EditPriceScheduleModalCtrl', EditPriceScheduleModalController)
    .controller('EditProductModalCtrl', EditProductModalController)
;

function ProductManagementModalFactory($uibModal, $q, OrderCloud) {
    return {
        CreateAssignment : _createAssignment,
        CreatePriceSchedule : _createPriceSchedule,
        EditPriceSchedule : _editPriceSchedule,
        EditProduct : _editProduct
    };

    function _createAssignment(){
        return $uibModal.open({
            templateUrl: 'productManagement/modals/templates/createAssignment.html',
            controller: 'CreateAssignmentModalCtrl',
            controllerAs: 'createAssignmentModal',
            size: 'lg',
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
        }).result
    }

    function _createPriceSchedule(){
       return $uibModal.open({
            templateUrl: 'productManagement/modals/templates/createPriceSchedule.html',
            controller: 'CreatePriceScheduleModalCtrl',
            controllerAs: 'createPriceScheduleModal',
            size: 'lg'
        }).result
    }

    function _editPriceSchedule(priceSchedule) {
        var priceSchedule = angular.copy(priceSchedule);
        return $uibModal.open({
            templateUrl: 'productManagement/modals/templates/editPriceSchedule.html',
            controller: 'EditPriceScheduleModalCtrl',
            controllerAs: 'editPriceScheduleModal',
            size: 'lg',
            resolve: {
                SelectedPriceSchedule: function() {
                    return priceSchedule;
                },
                ProductsAssignedToPriceSchedule: function(){

                    var productsAssignedToPriceSchedule = [];
                    var dfd = $q.defer();
                    OrderCloud.Products.ListAssignments(null, null, null, null, priceSchedule.ID, null, null, null )
                        .then(function(data){
                            angular.forEach(data.Items, function(assignment){
                                productsAssignedToPriceSchedule.push(assignment.ProductID)
                            });
                            productsAssignedToPriceSchedule = _.uniq(productsAssignedToPriceSchedule);
                            dfd.resolve(productsAssignedToPriceSchedule)
                        });
                    return dfd.promise;
                }
            }
        }).result
    }

    function _editProduct(productID){
       return $uibModal.open({
            animation: true,
            templateUrl: 'productManagement/modals/templates/editProduct.html',
            controller: 'EditProductModalCtrl',
            controllerAs: 'editProductModal',
            size: 'lg',
            resolve: {
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get(productID);
                }
            }
        }).result

    }
}

function CreateAssignmentModalController($q, $stateParams, $state, $uibModalInstance, toastr, OrderCloud, PriceScheduleList, Assignments, SelectedProduct, Buyers, ProductManagementModal){
    var vm = this;
    vm.assignBuyer = false;
    vm.assignments =  Assignments;
    vm.buyers = Buyers;
    vm.model = {
        ProductID : $stateParams.productid,
        BuyerID : vm.selectedBuyer,
        UserGroupID :  null,
        PriceScheduleID : null
    };
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
                vm.selectedPriceSchedule = data;
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
                vm.assignments = data;
            })
    };

    function saveAssignment() {
        if (vm.selectedBuyer && (vm.selectedUserGroups == null ||  vm.selectedUserGroups.length == 0 )) {
            var assignmentBuyer = angular.copy(vm.model);
            assignmentBuyer.PriceScheduleID = vm.selectedPriceSchedule.ID;
            OrderCloud.Products.SaveAssignment(assignmentBuyer)
                .then(function(){
                    toastr.success('Assignment Updated', 'Success');
                    $uibModalInstance.close();
                    $state.go('.',{},{reload: true})
                })
                .catch(function (error) {
                    toastr.error('An error occurred while trying to save your product assignment', 'Error');
                });
        } else if(vm.selectedBuyer && vm.selectedUserGroups.length > 0 ) {
            var assignmentQueue = [];
            var df = $q.defer();
            angular.forEach(vm.selectedUserGroups, function(usergroup){
                var assignment = angular.copy(vm.model);
                assignment.PriceScheduleID = vm.selectedPriceSchedule.ID;
                assignment.UserGroupID = usergroup.ID;
                assignmentQueue.push(OrderCloud.Products.SaveAssignment(assignment));
            });

            $q.all(assignmentQueue)
                .then(function () {
                    df.resolve();
                    toastr.success('Assignment Updated', 'Success');
                    $uibModalInstance.close();
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

function CreatePriceScheduleModalController($q, $uibModalInstance, $exceptionHandler, toastr, OrderCloud, PriceBreak) {
    var vm = this;
    vm.priceSchedule = {};
    vm.priceSchedule.RestrictedQuantity = false;
    vm.priceSchedule.PriceBreaks = [];
    vm.priceSchedule.MinQuantity = 1;
    vm.priceSchedule.OrderType = 'Standard';

    vm.addPriceBreak = addPriceBreak;
    vm.deletePriceBreak = PriceBreak.DeletePriceBreak;
    vm.submit = submit;
    vm.cancel = cancel;

    function addPriceBreak() {
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    };

    function submit () {
        //loading indicator promise
        var df =  $q.defer();
        df.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
        df.message = 'Creating Price Schedule';
        vm.loading = df;

        vm.priceSchedule = PriceBreak.SetMinMax(vm.priceSchedule);
        OrderCloud.PriceSchedules.Create(vm.priceSchedule)
            .then(function (data) {
                df.resolve(data);
                $uibModalInstance.close(data);
                toastr.success('Price Schedule Created', 'Success')
            })
            .catch(function (ex) {
                $exceptionHandler(ex)
            });
    };

    function cancel() {
        $uibModalInstance.dismiss('cancel');
    };
};

function EditPriceScheduleModalController($q, $state, $exceptionHandler, $uibModalInstance, toastr, OrderCloud, SelectedPriceSchedule, PriceBreak , ProductsAssignedToPriceSchedule, OrderCloudConfirm) {
    var vm = this;
    vm.priceSchedule = SelectedPriceSchedule;
    vm.productsAssignedToPriceSchedule = ProductsAssignedToPriceSchedule;

    PriceBreak.AddDisplayQuantity(vm.priceSchedule);
    vm.addPriceBreak = addPriceBreak;
    vm.cancel = cancel;
    vm.Delete = Delete;
    vm.deletePriceBreak = deletePriceBreak;
    vm.submit = submit;


    function addPriceBreak(){
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    };

    function deletePriceBreak(priceSchedule, index){
        PriceBreak.DeletePriceBreak(priceSchedule, index)
    };

    function cancel() {
        $uibModalInstance.dismiss();
    };

    function submit() {
        //loading indicator promise
        var df =  $q.defer();
        df.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
        df.message = 'Editing Price Schedule';
        vm.loading = df;

        OrderCloud.PriceSchedules.Patch(vm.priceSchedule.ID, vm.priceSchedule)
            .then(function(data){
                df.resolve(data);
                $uibModalInstance.close(data);
                toastr.success('Price Schedule modified', 'Success');
            })
            .catch(function(error){
                $exceptionHandler(error);
            });
    };

    function Delete(){
        OrderCloudConfirm.Confirm("Are you sure you want to delete this Price Schedule, it may be assigned to other products?")
            .then(function(){
                var df = $q.defer();
                df.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
                df.message = 'Deleting Selected Price Schedule';
                vm.loading = df;

                OrderCloud.PriceSchedules.Delete(vm.priceSchedule.ID)
                    .then(function(){
                        df.resolve();
                        $uibModalInstance.close();
                        toastr.success('Price Schedule Deleted', 'Success');
                        $state.go('.', {}, {reload: true});
                    })
                    .catch(function(error) {
                        $exceptionHandler(error);
                    });
            });
    }
}

function EditProductModalController($q, $exceptionHandler, $uibModalInstance, $state, $stateParams, toastr, OrderCloud, SelectedProduct) {
    var vm = this,
        productid = angular.copy(SelectedProduct.ID);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.productID = $stateParams.productid;
    vm.product = SelectedProduct;

    vm.updateProduct = updateProduct;
    vm.submit = submit;
    vm.cancel = cancel;

    function updateProduct() {
        //loading indicator promise
        var df =  $q.defer();
        df.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
        df.message = 'Updating Product';
        vm.loading = df;

        OrderCloud.Products.Update(productid, vm.product)
            .then(function(data) {
                df.resolve(data);
                $uibModalInstance.close(data);
                $state.go('products.detail', {productid: data.ID}, {reload: true});
                toastr.success('Product Updated', 'Success');

            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    function submit() {
        $uibModalInstance.close();
    };

    function cancel() {
        $uibModalInstance.dismiss('cancel');
    };

}


