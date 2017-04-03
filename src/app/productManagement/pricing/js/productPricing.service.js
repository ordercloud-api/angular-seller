angular.module('orderCloud')
    .factory('ocProductPricing', ocProductPricingService);

function ocProductPricingService($q, $uibModal, sdkOrderCloud, OrderCloud, ocConfirm) {
    var service = {
        AssignmentList: _assignmentList,
        AssignmentData: _assignmentData,
        AssignmentDataDetail: _assignmentDataDetail,
        CreateAssignment: _createAssignment,
        CreateUserGroupAssignment: _createUserGroupAssignment,
        CreatePrice: _createPrice,
        EditPrice: _editPrice,
        DeletePrice: _deletePrice,
        PriceBreaks: {
            Create: _createPriceBreak,
            Edit: _editPriceBreak,
            SetMinMax: _setMinMax,
            Delete: _deletePriceBreak,
            AddDisplayQuantity: _addDisplayQuantity,
            DisplayQuantity: displayQuantity
        },
        GetProductListPriceSchedules: _getProductListPriceSchedules,
        Assignments: {
            Get: _getAssignments,
            Map: _mapAssignments,
            Exists: _exists
        },
        UpdateProductPrice: _updateProductPrice,
        CreateProductPrice: _createProductPrice,
        SelectPrice: _selectPrice
    };

    function _assignmentList(productid) {
        var deferred = $q.defer();

        var page = 1;
        var pageSize = 100;
        OrderCloud.Products.ListAssignments(productid, null, null, null, null, page, pageSize, null)
            .then(function (data) {
                var queue = [];
                var assignments = data;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        queue.push(OrderCloud.Products.ListAssignments(productid, null, null, null, null, page, data.Meta.PageSize, null));
                    }
                    return $q.all(queue)
                        .then(function (results) {
                            angular.forEach(results, function (result) {
                                assignments.Items = [].concat(assignments.Items, result.Items);
                                assignments.Meta = result.Meta;
                            });
                            assignments.buyerlist = _.uniq(_.pluck(assignments.Items, 'BuyerID'));

                            deferred.resolve(assignments);
                        });
                } else {
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

        angular.forEach(schedules, function (id) {
            psQueue.push(OrderCloud.PriceSchedules.Get(id));
        });
        $q.all(psQueue)
            .then(function (results) {
                angular.forEach(results, function (ps) {
                    angular.forEach(_.where(assignments.Items, {
                        PriceScheduleID: ps.ID
                    }), function (p) {
                        p.PriceSchedule = ps;
                        displayQuantity(p.PriceSchedule);
                    });
                });
                groupBy();
            });

        function groupBy() {
            var results = {};
            var priceSchedules = _.groupBy(assignments.Items, 'PriceScheduleID');
            angular.forEach(priceSchedules, function (assignments, key) {
                results[key] = {
                    PriceSchedule: assignments[0].PriceSchedule,
                    Buyers: [],
                    UserGroups: []
                };
                angular.forEach(assignments, function (details) {
                    if (details.BuyerID && !details.UserGroupID) {
                        results[key].Buyers.push(details.BuyerID);
                    } else if (details.BuyerID && details.UserGroupID) {
                        results[key].UserGroups.push({
                            BuyerID: details.BuyerID,
                            UserGroupID: details.UserGroupID
                        });
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
        angular.forEach(userGroupGroups, function (group) {
            userGroupChunks = userGroupChunks.concat(chunks(group));
        });

        var buyerQueue = [];
        var userGroupQueue = [];

        angular.forEach(buyerChunks, function (chunk) {
            buyerQueue.push(OrderCloud.Buyers.List(null, null, null, null, null, {
                ID: chunk.join('|')
            }));
        });

        angular.forEach(userGroupChunks, function (chunk) {
            userGroupQueue.push((function () {
                var d = $q.defer();
                var buyerID = chunk[0].BuyerID;

                OrderCloud.UserGroups.List(null, null, null, null, null, {
                        ID: _.pluck(chunk, 'UserGroupID').join('|')
                    }, buyerID)
                    .then(function (data) {
                        angular.forEach(_.where(result.Buyers, {
                            ID: buyerID
                        }), function (buyer) {
                            if (!buyer.UserGroups) buyer.UserGroups = [];
                            buyer.UserGroups = buyer.UserGroups.concat(data.Items);
                        });
                        d.resolve();
                    });

                return d.promise;
            })());
        });

        $q.all(buyerQueue)
            .then(function (results) {
                angular.forEach(results, function (r) {
                    _.map(r.Items, function (buyer) {
                        buyer.Assigned = data.Buyers.indexOf(buyer.ID) > -1;
                    });
                    result.Buyers = result.Buyers.concat(r.Items);
                });
                getUserGroups();
            });

        function getUserGroups() {
            $q.all(userGroupQueue)
                .then(function (results) {
                    deferred.resolve(result);
                });
        }

        function chunks(list) {
            var i, j, listChunks = [],
                chunkSize = 10;
            for (i = 0, j = list.length; i < j; i += chunkSize) {
                listChunks.push(list.slice(i, i + chunkSize));
            }
            return listChunks;
        }

        return deferred.promise;
    }

    function _createAssignment(selectedPrice) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceScheduleAssignment.modal.html',
            size: 'md',
            controller: 'PriceScheduleCreateAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function () {
                    return OrderCloud.Buyers.List(null, 1, 100);
                },
                SelectedPrice: function () {
                    return selectedPrice;
                },
                SelectedBuyer: function () {
                    return null;
                },
                BuyerUserGroups: function () {
                    return null;
                },
                AssignedUserGroups: function () {
                    return null;
                }
            }
        }).result;
    }

    function _createUserGroupAssignment(scope, selectedPrice) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceScheduleAssignment.modal.html',
            size: 'md',
            controller: 'PriceScheduleCreateAssignmentCtrl',
            controllerAs: 'priceScheduleAssignment',
            resolve: {
                Buyers: function () {
                    return {
                        Items: [scope.buyer]
                    };
                },
                SelectedPrice: function () {
                    return selectedPrice;
                },
                SelectedBuyer: function () {
                    return scope.buyer;
                },
                BuyerUserGroups: function () {
                    return OrderCloud.UserGroups.List(null, 1, 20, null, null, null, scope.buyer.ID);
                },
                AssignedUserGroups: function () {
                    return scope.buyer.UserGroups;
                }
            }
        }).result;
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
                var catalogAssignment = {
                    catalogID: selectedBuyer.DefaultCatalogID,
                    productID: product.ID
                };
                var result = {
                    Assignment: assignment,
                    NewPriceSchedule: ps
                };
                sdkOrderCloud.Catalogs.SaveProductAssignment(catalogAssignment)
                    .then(function() {
                        if (selectedBuyer && (selectedUserGroups == null || selectedUserGroups.length == 0 )) {
                            OrderCloud.Products.SaveAssignment(assignment)
                                .then(function(data){
                                    deferred.resolve(result);
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
                                assignmentQueue.push(sdkOrderCloud.Products.SaveAssignment(userGroupAssignment));
                            });
                            $q.all(assignmentQueue)
                                .then(function (data) {
                                    deferred.resolve(result);
                                })
                                .catch(function (error) {
                                    deferred.reject(error);
                                });
                        }
                    });
                
            })
            .catch(function (ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _editPrice(priceSchedule) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceScheduleEdit.modal.html',
            controller: 'PriceScheduleEditModalCtrl',
            controllerAs: 'priceScheduleEditModal',
            resolve: {
                SelectedPriceSchedule: function () {
                    return priceSchedule;
                }
            }
        }).result;
    }

    function _deletePrice(priceSchedule) {
        return ocConfirm.Confirm({
                message: 'Are you sure you want to delete <br> <b>' + priceSchedule.Name + '</b>?',
                confirmText: 'Delete price',
                type: 'delete'
            })
            .then(function () {
                return OrderCloud.PriceSchedules.Delete(priceSchedule.ID);
            });
    }

    function _createPriceBreak(priceSchedule) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceSchedulePriceBreakCreate.modal.html',
            size: 'md',
            controller: 'PriceSchedulePriceBreakCreateCtrl',
            controllerAs: 'priceBreakCreate',
            resolve: {
                PriceScheduleID: function () {
                    return priceSchedule.ID;
                }
            }
        }).result;
    }

    function _editPriceBreak(priceSchedule, priceBreak) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/priceSchedulePriceBreakEdit.modal.html',
            size: 'md',
            controller: 'PriceSchedulePriceBreakEditCtrl',
            controllerAs: 'priceBreakEdit',
            resolve: {
                PriceScheduleID: function () {
                    return priceSchedule.ID;
                },
                PriceBreak: function () {
                    return priceBreak;
                }
            }
        }).result;
    }

    function _setMinMax(priceSchedule) {
        var quantities = _.pluck(priceSchedule.PriceBreaks, 'Quantity');
        priceSchedule.MinQuantity = _.min(quantities);
        if (priceSchedule.RestrictedQuantity) {
            priceSchedule.MaxQuantity = _.max(quantities);
        }
        return priceSchedule;
    }

    function _deletePriceBreak(priceSchedule, priceBreak) {
        return ocConfirm.Confirm({
                message: 'Are you sure you want to delete this price break?<br> <b>Quantity: ' + priceBreak.Quantity + '</b>?',
                confirmText: 'Delete price break',
                type: 'delete'
            })
            .then(function () {
                return OrderCloud.PriceSchedules.DeletePriceBreak(priceSchedule.ID, priceBreak.Quantity)
                    .then(function () {
                        return OrderCloud.PriceSchedules.Get(priceSchedule.ID)
                            .then(function (updatedPriceSchedule) {
                                return updatedPriceSchedule;
                            });
                    });
            });
    }

    function _addDisplayQuantity(priceSchedule) {
        displayQuantity(priceSchedule);
        return _setMinMax(priceSchedule);
    }

    function displayQuantity(priceSchedule) {
        //Organize the priceschedule array in order of quantity
        priceSchedule.PriceBreaks.sort(function (a, b) {
            return a.Quantity - b.Quantity;
        });
        //find out the max quantity in the array
        var maxQuantity = Math.max.apply(Math, priceSchedule.PriceBreaks.map(function (object) {
            return object.Quantity;
        }));
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
                        priceSchedule.PriceBreaks[i].displayQuantity = itemQuantityRange[0] + ' - ' + itemQuantityRange[itemQuantityRange.length - 1];
                    }
                }
            }
        }
    }

    var cachedProductAssignmentResults = {};

    function _getAssignments(productID, level, cacheID, buyerID) {
        if (cachedProductAssignmentResults.cacheID === cacheID && cachedProductAssignmentResults.level == level && !productID) return cachedProductAssignmentResults.results;
        cachedProductAssignmentResults.cacheID = cacheID;
        cachedProductAssignmentResults.level = level;
        var options = {
            level: level,
            buyerID: buyerID,
            productID: productID,
            pageSize: 100
        };
        return sdkOrderCloud.Products.ListAssignments(options)
            .then(function (data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while (currentPage < totalPages) {
                    currentPage++;
                    options.page = currentPage;
                    queue.push(sdkOrderCloud.Products.ListAssignments(options));
                }
                $q.all(queue)
                    .then(function (results) {
                        angular.forEach(results, function (r) {
                            data1.Items = data1.Items.concat(r.Items);
                        });
                        if (!productID) cachedProductAssignmentResults.results = data1.Items;
                        df.resolve(data1.Items);
                    })
                    .catch(function(ex) {
                        df.reject(ex);
                    });
                return df.promise;
            });
    }

    function _getProductListPriceSchedules(productList, BuyerProductAssignments, UserGroupProductAssignments) {
        var df = $q.defer();
        if (!UserGroupProductAssignments) UserGroupProductAssignments = [];
        var priceScheduleIDs = _.uniq(_.pluck(BuyerProductAssignments.concat(UserGroupProductAssignments), 'PriceScheduleID'));
        var defaultPriceScheduleIDs = _.pluck(_.filter(productList.Items, function (product) {
            return product.DefaultPriceScheduleID !== null;
        }), 'DefaultPriceScheduleID');
        var allIDs = _.unique(defaultPriceScheduleIDs.concat(priceScheduleIDs));
        if (!allIDs.length) {
            df.resolve([]);
        } else {
            _retrievePriceSchedules(allIDs);
        }
        return df.promise;

        function _retrievePriceSchedules(priceScheduleIDs) {
            function chunks(list) {
                var i, j, listChunks = [], chunkSize = 80;
                for (i = 0, j = list.length; i < j; i += chunkSize) {
                    listChunks.push(list.slice(i, i + chunkSize));
                }
                return listChunks;
            }

            var priceChunks = chunks(priceScheduleIDs);

            var priceQueue = [];
            var fullPriceList = [];

            angular.forEach(priceChunks, function(chunk) {
                priceQueue.push(sdkOrderCloud.PriceSchedules.List({
                    pageSize: 100,
                    filters: {
                        ID: chunk.join('|')
                    }
                }));
            });

            $q.all(priceQueue).then(function(results) {
                angular.forEach(results, function(result) {
                    fullPriceList = fullPriceList.concat(result.Items);
                });
                df.resolve(fullPriceList);
            });
        }
    }

    function _mapAssignments(buyerID, userGroupID, productList, priceList, BuyerProductAssignments, UserGroupProductAssignments) {
        if (!UserGroupProductAssignments) UserGroupProductAssignments = [];
        _.each(productList.Items, function (product) {
            var assignedBuyerPrice = _.findWhere(BuyerProductAssignments, {ProductID: product.ID, BuyerID: buyerID, UserGroupID: null});
            var assignedUserGroupPrice = _.findWhere(UserGroupProductAssignments, {ProductID: product.ID, UserGroupID: userGroupID});
            if (assignedUserGroupPrice) {
                product.SelectedPrice = _.findWhere(priceList, {
                    ID: assignedUserGroupPrice.PriceScheduleID
                });
            } else if (assignedBuyerPrice) {
                product.SelectedPrice = _.findWhere(priceList, {
                    ID: assignedBuyerPrice.PriceScheduleID
                });
                product.SelectedPrice.Inherited = true;
            } else if (product.DefaultPriceScheduleID) {
                product.SelectedPrice = _.findWhere(priceList, {
                    ID: product.DefaultPriceScheduleID
                });
            } else {
                product.SelectedPrice = null;
            }
        });
        return productList;
    }

    function _exists(SelectPriceData) {
        var otherAssignmentsExist = _.filter(SelectPriceData.CurrentAssignments, function(assignment) {
            return (SelectPriceData.Product.SelectedPrice && (assignment.ProductID === SelectPriceData.Product.ID) && (assignment.PriceScheduleID === SelectPriceData.Product.SelectedPrice.ID));
        }).length > 1;

        var index = _.findIndex(SelectPriceData.CurrentAssignments, function(assignment) {
            return (assignment.ProductID === SelectPriceData.Product.ID && assignment.BuyerID === SelectPriceData.Buyer.ID && ((SelectPriceData.UserGroup && SelectPriceData.UserGroup.ID == assignment.UserGroupID) || !assignment.UserGroupID));
        });

        return {DoesExist: otherAssignmentsExist, Index: index};
    }

    function _updateProductPrice(product, SelectedBuyer, CurrentAssignments, SelectedUserGroup) {
        var priceScheduleIDs = _.unique((product.DefaultPriceScheduleID ? [product.DefaultPriceScheduleID] : [])
                                        .concat(_.pluck(_.filter(CurrentAssignments, {ProductID: product.ID}), 'PriceScheduleID')));
        
        if (priceScheduleIDs.length === 1 && priceScheduleIDs[0] === product.DefaultPriceScheduleID) {
            return _createProductPrice(product, SelectedBuyer, CurrentAssignments);
        } else {
            return $uibModal.open({
                templateUrl: 'productManagement/buyerProducts/templates/selectPrice.modal.html',
                controller: 'SelectPriceModalCtrl',
                controllerAs: 'selectPriceModal',
                resolve: {
                    SelectPriceData: function() {
                        var df = $q.defer();
                        var result = {
                            Buyer: SelectedBuyer,
                            UserGroup: SelectedUserGroup,
                            Product: product,
                            CurrentAssignments: CurrentAssignments
                        };
                        sdkOrderCloud.PriceSchedules.List({filters: {ID: priceScheduleIDs.join('|')}})
                            .then(function(data) {
                                result.PriceScheduleList = data;
                                df.resolve(result);
                            });
                        return df.promise;
                    }
                }
            }).result;
        }
    }

    function _createProductPrice(product, SelectedBuyer, CurrentAssignments, SelectedUserGroup) {
        return $uibModal.open({
            templateUrl: 'productManagement/buyerProducts/templates/createPrice.modal.html',
            controller: 'CreatePriceModalCtrl',
            controllerAs: 'createPriceModal',
            resolve: {
                SelectPriceData: function() {
                    return {
                        Buyer: SelectedBuyer,
                        UserGroup: SelectedUserGroup,
                        Product: product,
                        CurrentAssignments: CurrentAssignments
                    };
                }
            }
        }).result;
    }

    function _selectPrice(SelectPriceData, selectedPriceSchedule, availablePriceSchedules) {
        var df = $q.defer();

        function select() {
            if (SelectPriceData.Product.DefaultPriceScheduleID === selectedPriceSchedule.ID) {
                //Default Price Selected
                var check = _exists(SelectPriceData);
                var defaultPriceSchedule = _.findWhere(availablePriceSchedules, {ID: SelectPriceData.Product.DefaultPriceScheduleID});

                if (check.DoesExist) {
                    //Other assignments to previous price schedule exist
                    sdkOrderCloud.Products.DeleteAssignment(SelectPriceData.Product.ID, SelectPriceData.Buyer.ID)
                        .then(function() {
                            SelectPriceData.CurrentAssignments.splice(check.Index, 1);
                            df.resolve({SelectedPrice: defaultPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                        });
                } else {
                    //No other assignments to previous price schedule exist
                    sdkOrderCloud.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                        .then(function() {
                            SelectPriceData.CurrentAssignments.splice(check.Index, 1);
                            df.resolve({SelectedPrice: defaultPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                        });
                }
            } else {
                //Price schedule selected - Not default
                var assignment = {
                    BuyerID: SelectPriceData.Buyer.ID,
                    UserGroupID: SelectPriceData.UserGroup ? SelectPriceData.UserGroup.ID : null,
                    ProductID: SelectPriceData.Product.ID,
                    PriceScheduleID: selectedPriceSchedule.ID
                };
                sdkOrderCloud.Products.SaveAssignment(assignment)
                    .then(function() {
                        var check = _exists(SelectPriceData);
                        if (!check.DoesExist && SelectPriceData.Product.SelectedPrice) {
                            sdkOrderCloud.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                                .then(function() {
                                    _complete(true);
                                });
                        } else {
                            _complete(false);
                        }

                        function _complete(wasDeleted) {
                            wasDeleted ? (SelectPriceData.CurrentAssignments.splice(check.Index, 1)) :
                                (check.Index > -1 ? (SelectPriceData.CurrentAssignments[check.Index] = assignment) : SelectPriceData.CurrentAssignments.push(assignment));
                            df.resolve({SelectedPrice: selectedPriceSchedule, UpdatedAssignments: SelectPriceData.CurrentAssignments});
                        }
                        
                    })
                    .catch(function(ex) {
                        if (ex.response.body.Errors[0].ErrorCode === 'Product.CannotAssignNotInBuyerCatalog') {
                            //Product has not been assigned to the catalog
                            sdkOrderCloud.Catalogs.SaveProductAssignment({
                                catalogID: SelectPriceData.Buyer.DefaultCatalogID,
                                productID: SelectPriceData.Product.ID
                            }).then(function() {
                                //Rerun select() now that product is assigned to catalog
                                select();
                            });
                        } else {
                            df.reject(ex);
                        }
                    });
            }
        }

        select();

        return df.promise;
    }

    return service;
}