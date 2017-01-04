angular.module('orderCloud')
    .config(ProductDetailConfig)
    .controller('DetailsCtrl', DetailsController)
;

function ProductDetailConfig($stateProvider) {
    $stateProvider
        .state('products.detail', {
            url: '/:productid/detail',
            templateUrl: 'productManagement/details/templates/details.html',
            controller: 'DetailsCtrl',
            controllerAs: 'details',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                SelectedProduct: function ($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                },
                Assignments: function($stateParams, OrderCloud, Parameters) {
                    return OrderCloud.Products.ListAssignments($stateParams.productid, Parameters.productID, Parameters.userID, Parameters.userGroupID, Parameters.level, Parameters.priceScheduleID, Parameters.page, Parameters.pageSize);
                },
                PriceSchedule: function (OrderCloud, $q, Assignments){
                    var priceSchedules = [];
                    var dfd = $q.defer();
                    angular.forEach(Assignments.Items, function(v){
                        priceSchedules.push(OrderCloud.PriceSchedules.Get(v.StandardPriceScheduleID))

                    });
                    $q.all(priceSchedules)
                        .then(function(data){
                            dfd.resolve(data);
                        });
                    return dfd.promise;
                }
            }
        })

}


function DetailsController($stateParams, $exceptionHandler, $state, toastr, OrderCloud, OrderCloudConfirm, Assignments, SelectedProduct, PriceSchedule, ProductManagementModal){
    var vm = this;

    vm.list = Assignments;
    vm.listAssignments = Assignments.Items;
    vm.product = SelectedProduct;
    vm.productID = $stateParams.productid;
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.schedule = PriceSchedule;

    vm.DeleteAssignment = DeleteAssignment;
    vm.deleteProduct = deleteProduct;
    vm.editProduct = editProduct;



    function editProduct() {
         ProductManagementModal.EditProduct($stateParams.productid)
             .then(function(data){
                 console.log("here is the product update", data);
                 vm.product = data;
             })
    };

    function DeleteAssignment(scope) {
        OrderCloud.Products.DeleteAssignment(scope.assignment.ProductID, null, scope.assignment.UserGroupID)
            .then(function() {
                $state.reload();
                toastr.success('Product Assignment Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    function deleteProduct(){
        OrderCloudConfirm.Confirm('Are you sure you want to delete this product?')
            .then(function(){
                OrderCloud.Products.Delete(vm.productID)
                    .then(function() {
                        toastr.success('Product Deleted', 'Success');
                        $state.go('products', {}, {reload: true});
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex)
                    });
            });
    };
}


