angular.module('orderCloud')
    .factory('ocProductPricing', ocProductPricingService)
;

function ocProductPricingService($q, toastr, OrderCloud, ocConfirm) {
    var service = {
        AssignmentList: _assignmentList,
        AssignmentData: _assignmentData,
        AssignmentDataDetail: _assignmentDataDetail,
        CreateAssignment: _createAssignment,
        CreatePrice: _createPrice,
        PriceBreaks: {
            Create : _createPriceBreak,
            SetMinMax: _setMinMax,
            Delete: _deletePriceBreak,
            AddDisplayQuantity: _addDisplayQuantity
        }
    };

    function _assignmentList(productid) {
        var deferred = $q.defer();

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
                            assignments.buyerlist = _.uniq(_.pluck(assignments.Items, 'BuyerID'));

                            deferred.resolve(assignments);
                        });
                } else{
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

    function _createAssignment(assignment) {
        var deferred = $q.defer();

        OrderCloud.Products.SaveAssignment(assignment)
            .then(function(data) {
                deferred.resolve(data);
            })
            .catch(function(ex) {
                if (ex.status == 409 && ex.data.Errors[0].ErrorCode == 'IdExists') {
                    ocConfirm.Confirm({
                            message: 'Another price schedule is already assigned to your selected party. Would you like to replace that assignment?'
                        })
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

        return deferred.promise;
    }

    function _createPrice(product, priceSchedule, selectedBuyer, selectedUserGroups) {
        var deferred = $q.defer();

        priceSchedule = _setMinMax(priceSchedule);

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

    function _createPriceBreak(priceSchedule, price, quantity) {
        var numberExist = _.findWhere(priceSchedule.PriceBreaks, {Quantity: quantity});
        if (quantity > priceSchedule.MaxQuantity) {
            toastr.error('Max quantity exceeded','Error');
        } else {
            numberExist === undefined ? priceSchedule.PriceBreaks.push({Price: price, Quantity: quantity}) : toastr.error('Quantity already exists. Please delete and re-enter quantity and price to edit', 'Error');
        }
        displayQuantity(priceSchedule);
        return _setMinMax(priceSchedule);
    }

    function _setMinMax(priceSchedule) {
        var quantities =  _.pluck(priceSchedule.PriceBreaks, 'Quantity');
        priceSchedule.MinQuantity = _.min(quantities);
        if (priceSchedule.RestrictedQuantity) {
            priceSchedule.MaxQuantity = _.max(quantities);
        }
        return priceSchedule;
    }

    function _deletePriceBreak(priceSchedule, index) {
        priceSchedule.PriceBreaks.splice(index, 1);
        return _setMinMax(priceSchedule);
    }

    function _addDisplayQuantity(priceSchedule) {
        displayQuantity(priceSchedule);
        return _setMinMax(priceSchedule);
    }

    function displayQuantity(priceSchedule) {
        //Organize the priceschedule array in order of quantity
        priceSchedule.PriceBreaks.sort(function(a,b) {return a.Quantity - b.Quantity});
        //find out the max quantity in the array
        var maxQuantity = Math.max.apply(Math,priceSchedule.PriceBreaks.map(function(object) {return object.Quantity}));
        // go through each item in the priceschedule array
        for (var i = 0; i < priceSchedule.PriceBreaks.length; i++) {
            //if max number is unique, display max number  with + symbol
            if (priceSchedule.PriceBreaks[i].Quantity == maxQuantity) {
                priceSchedule.PriceBreaks[i].displayQuantity = priceSchedule.PriceBreaks[i].Quantity + '+';
            } else {
                //otherwise get the range of numbers between the current index quantity , and the next index Quantity
                var itemQuantityRange = _.range(priceSchedule.PriceBreaks[i].Quantity, priceSchedule.PriceBreaks[i + 1].Quantity);
                itemQuantityRange;
                // If the difference between the range of numbers is only 1 . then just display that quantity number
                if (itemQuantityRange.length === 1) {
                    priceSchedule.PriceBreaks[i].displayQuantity = itemQuantityRange[0];
                } else {
                    //the last quantity in the array of PriceBreaks minus the 1st quantity in the calculate range is less than or =1 , add only the first number in the Item
                    if (((priceSchedule.PriceBreaks[priceSchedule.PriceBreaks.length - 1]).Quantity - itemQuantityRange[0]) <= 1) {
                        priceSchedule.PriceBreaks[i].displayQuantity = itemQuantityRange[0];
                        //displays range between two quantities in the array
                    } else {
                        priceSchedule.PriceBreaks[i].displayQuantity = itemQuantityRange[0] + '-' + itemQuantityRange[itemQuantityRange.length - 1];
                    }
                }
            }
        }
    }

    return service;
}