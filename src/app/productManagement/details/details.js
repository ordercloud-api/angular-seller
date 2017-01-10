angular.module('orderCloud')
    .config(ProductDetailConfig)
    .controller('DetailsCtrl', DetailsController)
    .filter()
;

function ProductDetailConfig($stateProvider) {
    $stateProvider
        .state('products.detail', {
            url: '/:productid/detail?page',
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
                AssignmentList: function($q, Parameters, $resource, OrderCloud, buyerid){
                    OrderCloud.BuyerID.Set(undefined);
                    return OrderCloud.Products.ListAssignments(Parameters.productid, null, null, null, null, null, null, null)
                        .then(function(data) {
                            var queue =[];
                             var assignments = data;
                            if(data.Meta.TotalPages > data.Meta.Page){
                                page = data.Meta.Page;
                                while(page < data.Meta.TotalPages){
                                    page += 1;
                                    queue.push(OrderCloud.Products.ListAssignments(Parameters.productid, null, null, null, null, page, null, null));
                                }
                                return $q.all(queue)
                                    .then(function(results){
                                        angular.forEach(results, function(result){
                                            assignments.Items = [].concat(assignments.Items, result.Items);
                                            assignments.Meta = result.Meta;
                                        });
                                        OrderCloud.BuyerID.Set(buyerid);
                                        assignments.buyerlist = _.uniq(_.pluck(assignments.Items, 'BuyerID'));

                                        return assignments;

                                    });
                            }else{
                                OrderCloud.BuyerID.Set(buyerid);
                                assignments.buyerlist = _.uniq(_.pluck(assignments.Items, 'BuyerID'));
                                return assignments;
                            }
                        });
                },
                //when we group together the price schedules by the id , it messes with the pagination, I would would have to update the meta data before it resolves , and then translate the results.
                AssignmentsData: function (OrderCloud, $q, AssignmentList){
                    console.log("this is assignment list",AssignmentList);
                    var assignments = AssignmentList;
                    var psQueue = [];
                    var schedules = _.uniq(_.pluck(assignments.Items, 'PriceScheduleID'));

                    angular.forEach(schedules, function(id) {
                        psQueue.push(OrderCloud.PriceSchedules.Get(id));
                    });
                    return $q.all(psQueue)
                        .then(function(results) {
                        angular.forEach(results, function(ps) {
                            angular.forEach(_.where(assignments.Items, {PriceScheduleID: ps.ID}), function(p) {
                                p.PriceSchedule = ps;
                            });
                        });
                         return groupBy()
                    });

                    function groupBy() {
                        var results = {};
                        var priceSchedules = _.groupBy(assignments.Items, 'PriceScheduleID');
                        angular.forEach(priceSchedules, function( assignments, key){
                            results[key] = {
                                PriceSchedule : assignments[0].PriceSchedule,
                                Buyers: [],
                                UserGroups: [],

                            };
                            console.log("this is results",results);
                            angular.forEach(assignments,function( details, index){
                                    if (details.BuyerID && !details.UserGroupID){
                                        results[key].Buyers.push(details.BuyerID)
                                    }
                                    else if(details.BuyerID && details.UserGroupID){
                                        results[key].UserGroups.push(details.UserGroupID)
                                    }
                            });
                        });
                        return results;
                    }
                }
            }
        })

}


function DetailsController($stateParams, $exceptionHandler, $state, toastr, OrderCloud, OrderCloudConfirm, AssignmentList, AssignmentsData, SelectedProduct, ProductManagementModal){
    var vm = this;
    console.log("this is the all the info", AssignmentsData);
    vm.list =AssignmentList;
    vm.listAssignments = AssignmentsData;
    vm.product = SelectedProduct;
    vm.productID = $stateParams.productid;
    vm.productName = angular.copy(SelectedProduct.Name);

    vm.deleteProduct = deleteProduct;
    vm.editProduct = editProduct;
    vm.newAssignment = newAssignment;


    function editProduct() {
         ProductManagementModal.EditProduct($stateParams.productid)
             .then(function(data){
                 vm.product = data;
             })
    }

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
    }

    function newAssignment(){
        ProductManagementModal.CreateAssignment()
            .then(function(data){
                console.log(data);
            })

    }


}


