angular.module('orderCloud')
    .factory('ocProductsService', ocProductsService)
;

function ocProductsService($q, toastr, OrderCloud, OrderCloudConfirm, PriceBreak) {
    var service = {
        AssignmentList: _assignmentList,
        AssignmentData: _assignmentData,
        AssignmentDataDetail: _assignmentDataDetail,
        AssignBuyerRemoveUserGroups: _assignBuyerRemoveUserGroups,
        CreateAssignment: _createAssignment,
        CreateNewPriceScheduleAndAssignments: _createNewPriceScheduleAndAssignments,
        ProductSpecsDetail: _productSpecsDetail,
        UpdateSpecListOrder: _updateSpecListOrder,
        UpdateSpecOptionsListOrder: _updateSpecOptionsListOrder,
        UpdateInventory: _updateInventory
    };

    function _assignmentList(productid, buyerid) {
        var deferred = $q.defer();

        OrderCloud.BuyerID.Set(undefined);

        var page = 1;
        var pageSize = 100;
        OrderCloud.Products.ListAssignments(productid, null, null, null, null, page, pageSize, null)
            .then(function(data) {
                var queue = [];
                var assignments = data;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        queue.push(OrderCloud.Products.ListAssignments(productid, null, null, null, null, page, data.Meta.PageSize, null));
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
    function _assignBuyerRemoveUserGroups(buyer, productid, pricescheduleid) {
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

    function _createAssignment(assignment) {
        var deferred = $q.defer();

        OrderCloud.Products.SaveAssignment(assignment)
            .then(function(data) {
                deferred.resolve(data);
            })
            .catch(function(ex) {
                if (ex.status == 409 && ex.data.Errors[0].ErrorCode == 'IdExists') {
                    OrderCloudConfirm.Confirm('Another price schedule is already assigned to your selected party. Would you like to replace that assignment?')
                        .then(function() {
                            OrderCloud.Products.DeleteAssignment(assignment.ProductID, null, assignment.UserGroupID, assignment.BuyerID)
                                .then(function() {
                                    OrderCloud.Products.SaveAssignment(assignment)
                                        .then(function(data) {
                                            deferred.resolve(data);
                                        });
                                });
                        })
                        .catch(function() {
                            deferred.reject();
                        });
                }
                else {
                    toastr.error('There was an error creating your assignment. Please try again.', 'Error');
                    deferred.reject(ex);
                }
            });

        /*OrderCloudConfirm.Confirm("Are you sure you want to delete this buyer organization and all of it's related data?  <b>This action cannot be undone.</b>")
            .then(function() {
                OrderCloud.Buyers.Delete(vm.selectedBuyer.ID)
                    .then(function() {
                        toastr.success(vm.selectedBuyer.Name + ' was deleted.', 'Success!');
                        $state.go('buyers');
                    })
            })*/

        return deferred.promise;
    }

    function _createNewPriceScheduleAndAssignments(product, priceSchedule, selectedBuyer, selectedUserGroups) {
        var deferred = $q.defer();

        priceSchedule = PriceBreak.SetMinMax(priceSchedule);

        OrderCloud.PriceSchedules.Create(priceSchedule)
            .then(function(ps) {
                var assignment = {
                    ProductID: product.ID,
                    PriceScheduleID: ps.ID,
                    BuyerID: selectedBuyer.ID
                };
                if (selectedBuyer && (selectedUserGroups == null || selectedUserGroups.length == 0 )) {
                    OrderCloud.Products.SaveAssignment(assignment)
                        .then(function(data){
                            deferred.resolve(data);
                        })
                        .catch(function (error) {
                            deferred.reject(error);
                        });
                }
                else if (selectedBuyer && selectedUserGroups.length > 0 ) {
                    var assignmentQueue = [];
                    angular.forEach(selectedUserGroups, function(usergroup) {
                        var userGroupAssignment = angular.copy(assignment);
                        userGroupAssignment.UserGroupID = usergroup.ID;
                        assignmentQueue.push(OrderCloud.Products.SaveAssignment(userGroupAssignment));
                    });
                    $q.all(assignmentQueue)
                        .then(function (data) {
                            deferred.resolve(data);
                        })
                        .catch(function (error) {
                            deferred.reject(error);
                        });
                }
            })
            .catch(function (ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _productSpecsDetail(productid) {
        var deferred = $q.defer();

        OrderCloud.Specs.ListProductAssignments(null, productid, 1, 100)
            .then(function(data) {
                if (data.Items.length) {
                    getSpecs(data);
                } else {
                    deferred.resolve(data);
                }
            });

        function getSpecs(data) {
            OrderCloud.Specs.List(null, null, null, null, null, {ID: _.pluck(data.Items, 'SpecID').join('|')})
                .then(function(details) {
                    getSpecOptions(data, details);
                });
        }

        function getSpecOptions(data, details) {
            var optionQueue = [];
            angular.forEach(data.Items, function(specAssignment) {
                specAssignment.Spec = _.where(details.Items, {ID: specAssignment.SpecID})[0];
                if (specAssignment.Spec && specAssignment.Spec.OptionCount) {
                    //OrderCloud.Specs.ListOptions(specAssignment.Spec.ID, null, 1, 100)
                    optionQueue.push((function() {
                        var d = $q.defer();

                        OrderCloud.Specs.ListOptions(specAssignment.Spec.ID, null, 1, 100)
                            .then(function(oData) {
                                specAssignment.Options = oData.Items;
                                d.resolve();
                            });

                        return d.promise;
                    })());
                }
            });

            $q.all(optionQueue).then(function() {
                deferred.resolve(data);
            });
        }

        return deferred.promise;
    }

    function _updateSpecListOrder(event) {
        var deferred = $q.defer();
        var nodeList = event.source.nodesScope.$modelValue;
        var queue = [];

        angular.forEach(nodeList, function(node, index) {
            queue.push((function() {
                return OrderCloud.Specs.Patch(node.Spec.ID, {ListOrder: index});
            }));
        });

        var queueIndex = 0;
        function run(i) {
            queue[i]().then(function() {
                queueIndex++;
                if (queueIndex < queue.length) {
                    run(queueIndex);
                }
                else {
                    deferred.resolve();
                }
            });
        }
        run(queueIndex);

        return deferred.promise;
    }

    function _updateSpecOptionsListOrder(event, specID) {
        var deferred = $q.defer();

        var nodeList = event.source.nodesScope.$modelValue;
        var queue = [];

        angular.forEach(nodeList, function(node, index) {
            queue.push((function() {
                return OrderCloud.Specs.PatchOption(specID, node.ID, {ListOrder: index});
            }));
        });

        var queueIndex = 0;
        function run(i) {
            queue[i]().then(function() {
                queueIndex++;
                if (queueIndex < queue.length) {
                    run(queueIndex);
                }
                else {
                    deferred.resolve();
                }
            });
        }
        run(queueIndex);

        return deferred.promise;
    }

    function _updateInventory(product, inventory) {
        var deferred = $q.defer();
        var inventoryResult;
        var queue = [];

        var productPartial = _.pick(product, ['InventoryNotificationPoint', 'AllowOrderExceedInventory']);
        queue.push(OrderCloud.Products.Patch(product.ID, productPartial));

        queue.push((function() {
            var d = $q.defer();

            OrderCloud.Products.UpdateInventory(product.ID, inventory.Available)
                .then(function(data) {
                    inventoryResult = data;
                    d.resolve();
                })
                .catch(function(ex) {
                    inventoryResult = ex;
                    d.reject();
                });

            return d.promise;
        })());

        $q.all(queue)
            .then(function() {
                deferred.resolve(inventoryResult);
            })
            .catch(function() {
                deferred.reject(inventoryResult);
            });

        return deferred.promise;
    }

    return service;
}