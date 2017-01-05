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
                AssignmentList: function($q, Parameters, $resource, OrderCloud, buyerid){
                  var assignments ;
                  var df = $q.defer();
                  var queue = [];
                  var page = 1;

                   OrderCloud.BuyerID.Set(null);
                    return OrderCloud.Products.ListAssignments(Parameters.productid, null, null, null, null, page, 3, null)
                        .then(function(data){
                              assignments = data;
                              if(data.Meta.TotalPages > data.Meta.Page){
                                  page = data.Meta.Page;
                                  while(page < data.Meta.TotalPages){
                                      page += 1;
                                      queue.push(OrderCloud.Products.ListAssignments(Parameters.productid, null, null, null, null, page, 3, null));
                                  }
                                  $q.all(queue)
                                      .then(function(results){
                                          angular.forEach(results, function(result){
                                              assignments.Items = [].concat(assignments.Items, result.Items);
                                              assignments.Meta = result.Meta;
                                          });

                                          df.resolve(assignments);

                                      });
                              }else{
                                  df.resolve(assignments);
                                  return assignments;
                              }
                            OrderCloud.BuyerID.Set(buyerid);
                            return(df.promise);
                        });
                },

                AssignmentsData: function (OrderCloud, $q, AssignmentList){
                    var df =  $q.defer();
                    var assignments = AssignmentList;
                    console.log("this is assignment list",AssignmentList);
                    var psQueue = [];
                    var buyerQueue = [];
                    var groupQueue = [];

                    var schedules = _.uniq(_.pluck(assignments.Items, 'PriceScheduleID'));
                    var buyers = _.uniq(_.pluck(assignments.Items, 'BuyerID'));
                    var groups = _.uniq(_.map(assignments.Items, function(assign) { return {UserGroupID: assign.UserGroupID, BuyerID: assign.BuyerID}}));

                    console.log("here", schedules, buyers, groups);

                    angular.forEach(schedules, function(id) {
                        psQueue.push(OrderCloud.PriceSchedules.Get(id));
                    });

                    angular.forEach(buyers, function(id) {
                        buyerQueue.push(OrderCloud.Buyers.Get(id));
                    });

                    angular.forEach(groups, function(assign) {
                        if(assign.UserGroupId != null){
                            groupQueue.push(OrderCloud.UserGroups.Get(assign.UserGroupID, assign.BuyerID));
                        }

                    });

                     $q.all(psQueue).then(function(results) {
                        angular.forEach(results, function(ps) {
                            angular.forEach(_.where(assignments.Items, {PriceScheduleID: ps.ID}), function(p) {
                                p.PriceSchedule = ps;
                            });
                        });
                          runBuyers()
                    });


                    function runBuyers() {
                        $q.all(buyerQueue).then(function(results) {
                            angular.forEach(results, function(buyer) {
                                angular.forEach(_.where(assignments.Items, {BuyerID: buyer.ID}), function(b) {
                                    b.Buyer = buyer;
                                });
                            });
                            runGroups();
                        });
                    }

                    function runGroups() {
                        $q.all(groupQueue).then(function(results) {
                            angular.forEach(results, function(group) {
                                angular.forEach(_.where(assignments.Items, {UserGroupID: group.ID}), function(g) {
                                    g.Group = group;
                                });
                            });
                            groupBy();
                        });
                    }
                    function groupBy() {
                        df.resolve(_.groupBy(assignments.Items, 'PriceScheduleID'));
                    }
                    return df.promise
                }
            }
        })

}


function DetailsController($stateParams, $exceptionHandler, $state, toastr, OrderCloud, OrderCloudConfirm, Assignments, AssignmentsData, SelectedProduct, ProductManagementModal){
    var vm = this;
    console.log("this is the all the info", AssignmentsData);
    vm.list = Assignments;
    // vm.listAssignments = Assignments;
    // vm.product = SelectedProduct;
    // vm.productID = $stateParams.productid;
    // vm.productName = angular.copy(SelectedProduct.Name);
    // vm.schedule = PriceSchedule;
    //
    //
    // vm.deleteProduct = deleteProduct;
    // vm.editProduct = editProduct;
    // vm.newAssignment = newAssignment;
    //
    //
    //
    // function editProduct() {
    //      ProductManagementModal.EditProduct($stateParams.productid)
    //          .then(function(data){
    //              vm.product = data;
    //          })
    // };
    //
    // function deleteProduct(){
    //     OrderCloudConfirm.Confirm('Are you sure you want to delete this product?')
    //         .then(function(){
    //             OrderCloud.Products.Delete(vm.productID)
    //                 .then(function() {
    //                     toastr.success('Product Deleted', 'Success');
    //                     $state.go('products', {}, {reload: true});
    //                 })
    //                 .catch(function(ex) {
    //                     $exceptionHandler(ex)
    //                 });
    //         });
    // };
    //
    // function newAssignment(){
    //     ProductManagementModal.CreateAssignment()
    //
    // }

}


