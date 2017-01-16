angular.module('orderCloud')
    .config(ProductDetailConfig)
    .controller('DetailsCtrl', DetailsController)
    .controller('PriceScheduleDetailsCtrl', PriceScheduleDetailsController)
    .controller('PriceSchedulePriceBreakCtrl', PriceSchedulePriceBreakController)
    .controller('PriceScheduleAssignmentCtrl', PriceScheduleAssignmentCtrl)
    .factory('ocProductPricing', ocProductPricing)
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
                AssignmentList: function(ocProductPricing, Parameters, buyerid) {
                    return ocProductPricing.AssignmentList(Parameters, buyerid);
                },
                //when we group together the price schedules by the id , it messes with the pagination, I would would have to update the meta data before it resolves , and then translate the results.
                AssignmentData: function (ocProductPricing, AssignmentList) {
                    return ocProductPricing.AssignmentData(AssignmentList);
                }
            }
        })
        .state('products.detail.price', {
            url: '/:pricescheduleid',
            templateUrl: 'productManagement/details/templates/priceScheduleDetails.html',
            controller: 'PriceScheduleDetailsCtrl',
            controllerAs: 'priceScheduleDetails',
            resolve: {
                AssignmentDataDetail: function($stateParams, ocProductPricing, AssignmentData) {
                    return ocProductPricing.AssignmentDataDetail(AssignmentData, $stateParams.pricescheduleid);
                }
            }
        })
    ;
}


function DetailsController($stateParams, $exceptionHandler, $state, toastr, OrderCloud, OrderCloudConfirm, AssignmentList, AssignmentData, SelectedProduct, ProductManagementModal){
    var vm = this;
    vm.list = AssignmentList;
    vm.listAssignments = AssignmentData;
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
             });
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
            });
    }
}

function PriceScheduleDetailsController($stateParams, $uibModal, OrderCloud, ocProductPricing, ocPatchModal, AssignmentDataDetail) {
    var vm = this;
    vm.data = AssignmentDataDetail;

    var fields = {
        'Name': {Key: 'Name', Label: 'Name', Required: true},
        'ID': {Key: 'ID', Label: 'ID', Required: true},
        'MinQuantity': {Key: 'MinQuantity', Label: 'Minimum Quantity', Required: true},
        'MaxQuantity': {Key: 'MaxQuantity', Label: 'Maximum Quantity', Required: true}
    };

    vm.editFields = function(properties) {
        var propertiesList = _.filter(fields, function(field) { return properties.indexOf(field.Key) > -1});
        ocPatchModal.Edit(vm.data.PriceSchedule, propertiesList, 'PriceSchedules', function(partial) {
            return OrderCloud.PriceSchedules.Patch(vm.data.PriceSchedule.ID, partial)
        }).then(function(result) {
            vm.data.PriceSchedule = result;
        });
    };

    vm.patchField = function(field) {
        var partial = _.pick(vm.data.PriceSchedule, field);
        OrderCloud.PriceSchedules.Patch(vm.data.PriceSchedule.ID, partial)
            .then(function(data) {
                vm.data.PriceSchedule = data;
            });
    };

    vm.createPriceBreak = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/details/templates/priceBreak.modal.html',
            size: 'md',
            controller: 'PriceSchedulePriceBreakCtrl',
            controllerAs: 'priceBreak',
            resolve: {
                PriceScheduleID: function() {
                    return vm.data.PriceSchedule.ID;
                }
            }
        });

        modalInstance.result.then(function(priceSchedule) {
            vm.data.PriceSchedule = priceSchedule;
        });
    };

    vm.deletePriceBreak = function(scope) {
        OrderCloud.PriceSchedules.DeletePriceBreak(vm.data.PriceSchedule.ID, scope.pb.Quantity)
            .then(function() {
                vm.data.PriceSchedule.PriceBreaks.splice(scope.$index, 1);
            });
    };

    vm.buyerAssignmentChange = function(buyer) {
        if (buyer.Assigned) {
            ocProductPricing.AssignBuyer(buyer, $stateParams.productid, vm.data.PriceSchedule.ID)
                .then(function(data) {
                    buyer = data;
                });
        }
        else {
            OrderCloud.Products.DeleteAssignment($stateParams.productid, null, null, buyer.ID)
                .then(function() {
                     buyer.UserGroups = [];
                });
        }
    };

    vm.addUserGroupAssignment = function(buyer) {
        var modalInstance = $uibModal.open({
            templateUrl: 'productManagement/details/templates/assignment.create.modal.html',
            size: 'md',
            controller: 'PriceScheduleAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function() {
                    return [buyer];
                },
                SelectedBuyer: function() {
                    return buyer;
                },
                BuyerUserGroups: function() {
                    return OrderCloud.UserGroups.List(null, 1, 20, null, null, null, buyer.ID);
                },
                AssignedUserGroups: function() {
                    return buyer.UserGroups;
                }
            }
        });

        modalInstance.result.then(function(assignment) {
            var existingBuyer = _.where(vm.data.Buyers, {ID: assignment.BuyerID});
            if (existingBuyer) {
                angular.forEach(vm.data.Buyers, function(buyer) {
                    if (buyer.ID == assignment.Buyer.ID) {
                        buyer.UserGroups.push(assignment.UserGroup);
                    }
                });
            }
            else {
                assignment.Buyer.Assigned = true;
                if (assignment.UserGroup) assignment.Buyer.UserGroups = [assignment.UserGroup];
                vm.data.Buyers.push(assignment.Buyer);
            }
        });
    };

    vm.deleteUserGroupAssignment = function(buyer, group) {
        vm.loading = {
            message: 'Saving...'
        };
        vm.loading = OrderCloud.Products.DeleteAssignment($stateParams.productid, null, group.ID, buyer.ID)
            .then(function() {
                angular.forEach(vm.data.Buyers, function(b) {
                    if (b.ID == buyer.ID) {
                        angular.forEach(b.UserGroups, function(g, index) {
                            if (g.ID == group.ID) {
                                b.UserGroups.splice(index, 1);
                            }
                        });
                    }
                });
            });
    };
}

function PriceSchedulePriceBreakController($uibModalInstance, OrderCloud, PriceScheduleID) {
    var vm = this;
    vm.priceBreak = {
        Quantity: 1,
        Price: 0
    };

    vm.confirm = function() {
        vm.loading = {
            message: 'Saving...'
        };
        vm.loading = OrderCloud.PriceSchedules.SavePriceBreak(PriceScheduleID, vm.priceBreak)
            .then(function(priceSchedule) {
                $uibModalInstance.close(priceSchedule);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function PriceScheduleAssignmentCtrl($uibModalInstance, $stateParams, OrderCloud, Buyers, SelectedBuyer, BuyerUserGroups, AssignedUserGroups) {
    var vm = this;
    vm.buyers = Buyers;
    vm.selectedBuyer = SelectedBuyer;
    vm.preSelectedBuyer = SelectedBuyer != null;
    vm.buyerUserGroups = {Items: []};
    console.log($stateParams);

    var assignedUserGroupIDs = _.pluck(AssignedUserGroups, 'ID');
    angular.forEach(BuyerUserGroups.Items, function(userGroup) {
         if (assignedUserGroupIDs.indexOf(userGroup.ID) == -1) {
             vm.buyerUserGroups.Items.push(userGroup);
         }
    });

    vm.confirm = function() {
        vm.loading = {
            message: 'Saving...'
        };
        var assignment = {
            ProductID: $stateParams.productid,
            PriceScheduleID: $stateParams.pricescheduleid,
            BuyerID: vm.selectedBuyer.ID
        };
        if (vm.selectedUserGroup) assignment.UserGroupID = vm.selectedUserGroup.ID;
        vm.loading.promise = OrderCloud.Products.SaveAssignment(assignment)
            .then(function(data) {
                $uibModalInstance.close({Buyer: vm.selectedBuyer, UserGroup: vm.selectedUserGroup});
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}

function ocProductPricing($q, OrderCloud) {
    var service = {
        AssignmentList: _assignmentList,
        AssignmentData: _assignmentData,
        AssignmentDataDetail: _assignmentDataDetail,
        AssignBuyer: _assignBuyer
    };

    function _assignmentList(parameters, buyerid) {
        var deferred = $q.defer();

        OrderCloud.BuyerID.Set(undefined);

        var page = 1;
        var pageSize = 100;
        OrderCloud.Products.ListAssignments(parameters.productid, null, null, null, null, page, pageSize, null)
            .then(function(data) {
                var queue = [];
                var assignments = data;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        queue.push(OrderCloud.Products.ListAssignments(parameters.productid, null, null, null, null, page, data.Meta.PageSize, null));
                    }
                    return $q.all(queue)
                        .then(function(results) {
                            angular.forEach(results, function(result) {
                                assignments.Items = [].concat(assignments.Items, result.Items);
                                assignments.Meta = result.Meta;
                            });
                            OrderCloud.BuyerID.Set(buyerid);
                            assignments.buyerlist = _.uniq(_.pluck(assignments.Items, 'BuyerID'));

                            deferred.resolve(assignments);
                        });
                } else{
                    OrderCloud.BuyerID.Set(buyerid);
                    assignments.buyerlist = _.uniq(_.pluck(assignments.Items, 'BuyerID'));
                    deferred.resolve(assignments);
                }
            });

        return deferred.promise;
    }

    function _assignmentData(assignments) {
        var deferred = $q.defer();

        var psQueue = [];
        var schedules = _.uniq(_.pluck(assignments.Items, 'PriceScheduleID'));

        angular.forEach(schedules, function(id) {
            psQueue.push(OrderCloud.PriceSchedules.Get(id));
        });
        $q.all(psQueue)
            .then(function(results) {
                angular.forEach(results, function(ps) {
                    angular.forEach(_.where(assignments.Items, {PriceScheduleID: ps.ID}), function(p) {
                        p.PriceSchedule = ps;
                    });
                });
                groupBy();
            });

        function groupBy() {
            var results = {};
            var priceSchedules = _.groupBy(assignments.Items, 'PriceScheduleID');
            angular.forEach(priceSchedules, function(assignments, key) {
                results[key] = {
                    PriceSchedule: assignments[0].PriceSchedule,
                    Buyers: [],
                    UserGroups: []
                };
                angular.forEach(assignments,function(details) {
                    if (details.BuyerID && !details.UserGroupID) {
                        results[key].Buyers.push(details.BuyerID);
                    }
                    else if (details.BuyerID && details.UserGroupID) {
                        results[key].UserGroups.push({BuyerID: details.BuyerID, UserGroupID: details.UserGroupID});
                    }
                });
            });

            deferred.resolve(results);
        }

        return deferred.promise;
    }

    function _assignmentDataDetail(assignmentData, priceScheduleID) {
        var deferred = $q.defer();
        var data = assignmentData[priceScheduleID];
        var result = {
            PriceSchedule: data.PriceSchedule,
            Buyers: []
        };

        var buyerChunks = chunks(_.uniq(data.Buyers.concat(_.uniq(_.pluck(data.UserGroups, 'BuyerID')))));
        var userGroupGroups = _.groupBy(data.UserGroups, 'BuyerID');
        var userGroupChunks = [];
        angular.forEach(userGroupGroups, function(group) {
            userGroupChunks = userGroupChunks.concat(chunks(group));
        });

        var buyerQueue = [];
        var userGroupQueue = [];

        angular.forEach(buyerChunks, function(chunk) {
            buyerQueue.push(OrderCloud.Buyers.List(null, null, null, null, null, {ID: chunk.join('|')}));
        });

        angular.forEach(userGroupChunks, function(chunk) {
            userGroupQueue.push((function() {
                var d = $q.defer();
                var buyerID = chunk[0].BuyerID;

                OrderCloud.UserGroups.List(null, null, null, null, null, {ID: _.pluck(chunk, 'UserGroupID').join('|')}, buyerID)
                    .then(function(data) {
                        angular.forEach(_.where(result.Buyers, {ID: buyerID}), function(buyer) {
                            if (!buyer.UserGroups) buyer.UserGroups = [];
                            buyer.UserGroups = buyer.UserGroups.concat(data.Items);
                        });
                        d.resolve();
                    });

                return d.promise;
            })());
        });

        $q.all(buyerQueue)
            .then(function(results) {
                angular.forEach(results, function(r) {
                    _.map(r.Items, function(buyer) {
                        buyer.Assigned = data.Buyers.indexOf(buyer.ID) > -1;
                    });
                    result.Buyers = result.Buyers.concat(r.Items);
                });
                getUserGroups();
            });

        function getUserGroups() {
            $q.all(userGroupQueue)
                .then(function(results) {
                    deferred.resolve(result);
                });
        }

        function chunks(list) {
            var i, j, listChunks = [], chunkSize = 10;
            for (i = 0, j = list.length; i < j; i += chunkSize) {
                listChunks.push(list.slice(i, i + chunkSize));
            }
            return listChunks;
        }

        return deferred.promise;
    }

    //This method not only assigns the buyer company to the price schedule, but it removes any user group assignments under that buyer as well
    function _assignBuyer(buyer, productid, pricescheduleid) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(buyer.UserGroups, function(group) {
            queue.push(OrderCloud.Products.DeleteAssignment(productid, null, group.ID, buyer.ID));
        });
        queue.push(OrderCloud.Products.SaveAssignment({BuyerID: buyer.ID, ProductID: productid, PriceScheduleID: pricescheduleid}));

        $q.all(queue).then(function() {
            buyer.UserGroups = [];
            deferred.resolve(buyer);
        });

        return deferred.promise;
    }

    return service;
}


