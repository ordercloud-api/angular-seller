angular.module('orderCloud')
    .factory('ocProductPricing', ocProductPricingService);

function ocProductPricingService($q, $uibModal, OrderCloudSDK, ocConfirm) {
    var service = {
        AssignmentList: _assignmentList,
        AssignmentData: _assignmentData,
        AssignmentDataDetail: _assignmentDataDetail,
        CreatePrice: _createPrice,
        DeletePrice: _deletePrice,
        Assignments: {
            Get: _getAssignments,
            Map: _mapAssignments,
            Exists: _exists
        },
        GetProductListPriceSchedules: _getProductListPriceSchedules,
        PriceBreaks: {
            FormatQuantities: _formatQuantities
        },
        EditProductPrice: _editProductPricePrice,
        UpdateProductPrice: _updateProductPrice,
        CreateProductPrice: _createProductPrice,
        SelectPrice: _selectPrice,
        RemovePrice: _removePrice
    };

    function _assignmentList(productid) {
        var deferred = $q.defer();

        var options = {
            productID: productid,
            page: 1,
            pageSize: 100
        };
        OrderCloudSDK.Products.ListAssignments(options)
            .then(function (data) {
                var queue = [];
                var assignments = data;
                var page;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        options.page = page;
                        queue.push(OrderCloudSDK.Products.ListAssignments(options));
                    }
                    return $q.all(queue)
                        .then(function (results) {
                            angular.forEach(results, function (result) {
                                assignments.Items = [].concat(assignments.Items, result.Items);
                                assignments.Meta = result.Meta;
                            });
                            assignments.buyerlist = _.uniq(_.map(assignments.Items, 'BuyerID'));

                            deferred.resolve(assignments);
                        });
                } else {
                    assignments.buyerlist = _.uniq(_.map(assignments.Items, 'BuyerID'));
                    deferred.resolve(assignments);
                }
            });
        return deferred.promise;
    }

    function _assignmentData(assignments) {
        var deferred = $q.defer();

        assignments.Items = _.filter(assignments.Items, function(assignment) { return assignment.PriceScheduleID; });

        var psQueue = [];
        var schedules = _.uniq(_.map(assignments.Items, 'PriceScheduleID'));

        angular.forEach(schedules, function (id) {
            psQueue.push(OrderCloudSDK.PriceSchedules.Get(id));
        });
        $q.all(psQueue)
            .then(function (results) {
                angular.forEach(results, function (ps) {
                    angular.forEach(_.filter(assignments.Items, {
                        PriceScheduleID: ps.ID
                    }), function (p) {
                        p.PriceSchedule = ps;
                        _formatQuantities(p.PriceSchedule.PriceBreaks);
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

        var buyerChunks = chunks(_.uniq(data.Buyers.concat(_.uniq(_.map(data.UserGroups, 'BuyerID')))));
        var userGroupGroups = _.groupBy(data.UserGroups, 'BuyerID');
        var userGroupChunks = [];
        angular.forEach(userGroupGroups, function (group) {
            userGroupChunks = userGroupChunks.concat(chunks(group));
        });

        var buyerQueue = [];
        var userGroupQueue = [];

        angular.forEach(buyerChunks, function (chunk) {
            var options = {
                page: 1,
                pageSize: 100,
                filters: {ID: chunk.join('|')}
            };
            buyerQueue.push(OrderCloudSDK.Buyers.List(options));
        });

        angular.forEach(userGroupChunks, function (chunk) {
            userGroupQueue.push((function () {
                var d = $q.defer();
                var buyerID = chunk[0].BuyerID;

                var options = {
                    page: 1,
                    pageSize: 100,
                    filters: {ID: _.map(chunk, 'UserGroupID').join('|')}
                };
                OrderCloudSDK.UserGroups.List(buyerID, options)
                    .then(function (data) {
                        angular.forEach(_.filter(result.Buyers, {
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

    function _createPrice(product, priceSchedule, selectedBuyer, selectedUserGroups, defaultPriceSchedule) {
        var deferred = $q.defer();

        priceSchedule = _setMinMax(priceSchedule);

        OrderCloudSDK.PriceSchedules.Create(priceSchedule)
            .then(function (ps) {
                if (!defaultPriceSchedule) {
                    var assignment = {
                        ProductID: product.ID,
                        PriceScheduleID: ps.ID,
                        BuyerID: selectedBuyer.ID
                    };
                    var catalogAssignment = {
                        CatalogID: selectedBuyer.DefaultCatalogID,
                        ProductID: product.ID
                    };
                    var result = {
                        Assignment: assignment,
                        NewPriceSchedule: ps
                    };
                    OrderCloudSDK.Catalogs.SaveProductAssignment(catalogAssignment)
                        .then(function () {
                            if (selectedBuyer && (selectedUserGroups == null || selectedUserGroups.length === 0)) {
                                OrderCloudSDK.Products.SaveAssignment(assignment)
                                    .then(function (data) {
                                        deferred.resolve(result);
                                    })
                                    .catch(function (error) {
                                        deferred.reject(error);
                                    });
                            } else if (selectedBuyer && selectedUserGroups.length > 0) {
                                var assignmentQueue = [];
                                angular.forEach(selectedUserGroups, function (usergroup) {
                                    var userGroupAssignment = angular.copy(assignment);
                                    userGroupAssignment.UserGroupID = usergroup.ID;
                                    assignmentQueue.push(OrderCloudSDK.Products.SaveAssignment(userGroupAssignment));
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
                } else {
                    OrderCloudSDK.Products.Patch(product.ID, {
                            DefaultPriceScheduleID: ps.ID
                        })
                        .then(function () {
                            deferred.resolve({
                                NewPriceSchedule: ps
                            });
                        });
                }
            })
            .catch(function (ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _deletePrice(priceSchedule) {
        return ocConfirm.Confirm({
                message: 'Are you sure you want to delete <br> <b>' + priceSchedule.Name + '</b>?',
                confirmText: 'Delete price',
                type: 'delete'
            })
            .then(function () {
                return OrderCloudSDK.PriceSchedules.Delete(priceSchedule.ID);
            });
    }

    function _setMinMax(priceSchedule) {
        var quantities = _.map(priceSchedule.PriceBreaks, 'Quantity');
        priceSchedule.MinQuantity = _.min(quantities);
        if (priceSchedule.RestrictedQuantity) {
            priceSchedule.MaxQuantity = _.max(quantities);
        }
        return priceSchedule;
    }

    function _formatQuantities(priceBreaks) {
        //Organize the priceschedule array in order of quantity
        priceBreaks.sort(function (a, b) {
            return a.Quantity - b.Quantity;
        });
        //find out the max quantity in the array
        var maxQuantity = Math.max.apply(Math, priceBreaks.map(function (object) {
            return object.Quantity;
        }));
        // go through each item in the priceschedule array
        for (var i = 0; i < priceBreaks.length; i++) {
            //if max number is unique, display max number  with + symbol
            if (priceBreaks[i].Quantity == maxQuantity) {
                priceBreaks[i].displayQuantity = priceBreaks[i].Quantity + '+';
            } else {
                //otherwise get the range of numbers between the current index quantity , and the next index Quantity
                var itemQuantityRange = _.range(priceBreaks[i].Quantity, priceBreaks[i + 1].Quantity);
                itemQuantityRange;
                // If the difference between the range of numbers is only 1 . then just display that quantity number
                if (itemQuantityRange.length === 1) {
                    priceBreaks[i].displayQuantity = itemQuantityRange[0];
                } else {
                    //the last quantity in the array of PriceBreaks minus the 1st quantity in the calculate range is less than or =1 , add only the first number in the Item
                    if (((priceBreaks[priceBreaks.length - 1]).Quantity - itemQuantityRange[0]) <= 1) {
                        priceBreaks[i].displayQuantity = itemQuantityRange[0];
                        //displays range between two quantities in the array
                    } else {
                        priceBreaks[i].displayQuantity = itemQuantityRange[0] + ' - ' + itemQuantityRange[itemQuantityRange.length - 1];
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
        return OrderCloudSDK.Products.ListAssignments(options)
            .then(function (data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while (currentPage < totalPages) {
                    currentPage++;
                    options.page = currentPage;
                    queue.push(OrderCloudSDK.Products.ListAssignments(options));
                }
                $q.all(queue)
                    .then(function (results) {
                        angular.forEach(results, function (r) {
                            data1.Items = data1.Items.concat(r.Items);
                        });
                        if (!productID) cachedProductAssignmentResults.results = data1.Items;
                        df.resolve(data1.Items);
                    })
                    .catch(function (ex) {
                        df.reject(ex);
                    });
                return df.promise;
            });
    }

    function _getProductListPriceSchedules(productList, BuyerProductAssignments, UserGroupProductAssignments) {
        var df = $q.defer();
        if (!UserGroupProductAssignments) UserGroupProductAssignments = [];
        var priceScheduleIDs = _.uniq(_.map(BuyerProductAssignments.concat(UserGroupProductAssignments), 'PriceScheduleID'));
        var defaultPriceScheduleIDs = _.map(_.filter(productList.Items, function (product) {
            return product.DefaultPriceScheduleID !== null;
        }), 'DefaultPriceScheduleID');
        var allIDs = _.uniq(defaultPriceScheduleIDs.concat(priceScheduleIDs));
        if (!allIDs.length) {
            df.resolve([]);
        } else {
            _retrievePriceSchedules(allIDs);
        }
        return df.promise;

        function _retrievePriceSchedules(priceScheduleIDs) {
            function chunks(list) {
                var i, j, listChunks = [],
                    chunkSize = 80;
                for (i = 0, j = list.length; i < j; i += chunkSize) {
                    listChunks.push(list.slice(i, i + chunkSize));
                }
                return listChunks;
            }

            var priceChunks = chunks(priceScheduleIDs);

            var priceQueue = [];
            var fullPriceList = [];

            angular.forEach(priceChunks, function (chunk) {
                priceQueue.push(OrderCloudSDK.PriceSchedules.List({
                    pageSize: 100,
                    filters: {
                        ID: chunk.join('|')
                    }
                }));
            });

            $q.all(priceQueue).then(function (results) {
                angular.forEach(results, function (result) {
                    fullPriceList = fullPriceList.concat(result.Items);
                });
                df.resolve(fullPriceList);
            });
        }
    }

    function _mapAssignments(buyerID, userGroupID, productList, priceList, BuyerProductAssignments, UserGroupProductAssignments) {
        if (!UserGroupProductAssignments) UserGroupProductAssignments = [];
        _.each(productList.Items, function (product) {
            var assignedBuyerPrice = _.find(BuyerProductAssignments, {
                ProductID: product.ID,
                BuyerID: buyerID,
                UserGroupID: null
            });
            var assignedUserGroupPrice = _.find(UserGroupProductAssignments, {
                ProductID: product.ID,
                UserGroupID: userGroupID
            });
            if (assignedUserGroupPrice) {
                product.SelectedPrice = _.find(priceList, {
                    ID: assignedUserGroupPrice.PriceScheduleID
                });
            } else if (assignedBuyerPrice) {
                product.SelectedPrice = _.find(priceList, {
                    ID: assignedBuyerPrice.PriceScheduleID
                });
                product.SelectedPrice.Inherited = userGroupID !== null;
            } else if (product.DefaultPriceScheduleID) {
                product.SelectedPrice = _.find(priceList, {
                    ID: product.DefaultPriceScheduleID
                });
            } else {
                product.SelectedPrice = null;
            }
        });
        return productList;
    }

    function _exists(SelectPriceData) {
        var otherAssignmentsExist = _.filter(SelectPriceData.CurrentAssignments, function (assignment) {
            var partiesMatch = (SelectPriceData.Buyer.ID === assignment.BuyerID) && (SelectPriceData.UserGroup ? SelectPriceData.UserGroup.ID === assignment.UserGroupID : !assignment.UserGroupID);
            return (SelectPriceData.Product.SelectedPrice && (assignment.ProductID === SelectPriceData.Product.ID) && (assignment.PriceScheduleID === SelectPriceData.Product.SelectedPrice.ID) && !partiesMatch);
        }).length > 0;

        var index = _.findIndex(SelectPriceData.CurrentAssignments, function (assignment) {
            return (assignment.ProductID === SelectPriceData.Product.ID && assignment.BuyerID === SelectPriceData.Buyer.ID && ((SelectPriceData.UserGroup && SelectPriceData.UserGroup.ID === assignment.UserGroupID) || !assignment.UserGroupID));
        }); //TODO SOMETHING MISSES THE INHERITED PRICE HERE

        return {
            DoesExist: otherAssignmentsExist,
            Index: index
        };
    }

    function _editProductPricePrice(priceSchedule, isDefault) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/editProductPrice.modal.html',
            controller: 'EditProductPriceModalCtrl',
            controllerAs: 'editProductPriceModal',
            resolve: {
                SelectedPriceSchedule: function () {
                    return priceSchedule;
                },
                IsDefault: function() {
                    return isDefault;
                }
            }
        }).result;
    }

    function _updateProductPrice(product, SelectedBuyer, CurrentAssignments, SelectedUserGroup) {
        var priceScheduleIDs = _.uniq((product.DefaultPriceScheduleID ? [product.DefaultPriceScheduleID] : [])
            .concat(_.map(_.filter(CurrentAssignments, {
                ProductID: product.ID
            }), 'PriceScheduleID')));

        if (!priceScheduleIDs.length || priceScheduleIDs.length === 1 && (priceScheduleIDs[0] === product.DefaultPriceScheduleID || (product.SelectedPrice && product.SelectedPrice.Inherited))) {
            return _createProductPrice(product, SelectedBuyer, CurrentAssignments, SelectedUserGroup);
        } else {
            return $uibModal.open({
                templateUrl: 'productManagement/pricing/templates/updateProductPrice.modal.html',
                controller: 'UpdateProductPriceModalCtrl',
                controllerAs: 'updateProductPriceModal',
                resolve: {
                    SelectPriceData: function () {
                        var df = $q.defer();
                        var result = {
                            Buyer: SelectedBuyer,
                            UserGroup: SelectedUserGroup,
                            Product: product,
                            CurrentAssignments: CurrentAssignments
                        };
                        OrderCloudSDK.PriceSchedules.List({
                                filters: {
                                    ID: priceScheduleIDs.join('|')
                                }
                            })
                            .then(function (data) {
                                if (SelectedUserGroup) {
                                    //Find if price schedule would be inherited
                                    angular.forEach(data.Items, function (priceSchedule) {
                                        var buyerAssignment = _.find(CurrentAssignments, {
                                            ProductID: product.ID,
                                            PriceScheduleID: priceSchedule.ID,
                                            BuyerID: SelectedBuyer.ID,
                                            UserGroupID: null
                                        });
                                        if (buyerAssignment) priceSchedule.Inherited = true;
                                    });
                                }
                                result.PriceScheduleList = data;
                                df.resolve(result);
                            });
                        return df.promise;
                    }
                }
            }).result;
        }
    }

    function _createProductPrice(product, SelectedBuyer, CurrentAssignments, SelectedUserGroup, DefaultPriceSchedule) {
        return $uibModal.open({
            templateUrl: 'productManagement/pricing/templates/createProductPrice.modal.html',
            controller: 'CreateProductPriceModalCtrl',
            controllerAs: 'createProductPriceModal',
            resolve: {
                SelectPriceData: function () {
                    return {
                        Buyer: SelectedBuyer,
                        UserGroup: SelectedUserGroup,
                        Product: product,
                        CurrentAssignments: CurrentAssignments,
                        DefaultPriceSchedule: DefaultPriceSchedule
                    };
                }
            }
        }).result;
    }

    function _selectPrice(SelectPriceData, selectedPriceSchedule, availablePriceSchedules) {
        var df = $q.defer();

        var check = _exists(SelectPriceData);
        var assignment = {
            BuyerID: SelectPriceData.Buyer.ID,
            ProductID: SelectPriceData.Product.ID,
            PriceScheduleID: selectedPriceSchedule.ID,
            UserGroupID: SelectPriceData.UserGroup ? SelectPriceData.UserGroup.ID : null
        };

        function _complete(wasDeleted) {
            wasDeleted ? (SelectPriceData.CurrentAssignments.splice(check.Index, 1)) :
                (check.Index > -1 && (assignment.UserGroupID === SelectPriceData.CurrentAssignments[check.Index].UserGroupID) ? (SelectPriceData.CurrentAssignments[check.Index] = assignment) : SelectPriceData.CurrentAssignments.push(assignment));
            df.resolve({
                SelectedPrice: selectedPriceSchedule,
                UpdatedAssignments: SelectPriceData.CurrentAssignments
            });
        }

        function select() {
            if (SelectPriceData.Product.DefaultPriceScheduleID === selectedPriceSchedule.ID) {
                //Default Price Selected
                var defaultPriceSchedule = _.find(availablePriceSchedules, {
                    ID: SelectPriceData.Product.DefaultPriceScheduleID
                });

                if (check.DoesExist && !SelectPriceData.Product.SelectedPrice.Inherited) {
                    //Other assignments to previous price schedule exist
                    OrderCloudSDK.Products.DeleteAssignment(SelectPriceData.Product.ID, SelectPriceData.Buyer.ID, {
                            UserGroupID: SelectPriceData.UserGroup ? SelectPriceData.UserGroup.ID : null
                        })
                        .then(function () {
                            SelectPriceData.CurrentAssignments.splice(check.Index, 1);
                            df.resolve({
                                SelectedPrice: defaultPriceSchedule,
                                UpdatedAssignments: SelectPriceData.CurrentAssignments
                            });
                        });
                } else if (check.DoesExist && SelectPriceData.Product.SelectedPrice.Inherited) { //Assign directly to default price schedule
                    OrderCloudSDK.Products.SaveAssignment(assignment)
                        .then(function (data) {
                            _complete(false);
                        });
                } else {
                    //No other assignments to previous price schedule exist
                    OrderCloudSDK.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                        .then(function () {
                            SelectPriceData.CurrentAssignments.splice(check.Index, 1);
                            df.resolve({
                                SelectedPrice: defaultPriceSchedule,
                                UpdatedAssignments: SelectPriceData.CurrentAssignments
                            });
                        });
                }
            } else {
                //Price schedule selected - Not default
                if (selectedPriceSchedule.Inherited) {
                    //Price schedule selected is already inherited from buyer -- delete current if no other assignments
                    if (!check.DoesExist && SelectPriceData.Product.SelectedPrice && SelectPriceData.Product.SelectedPrice.ID !== SelectPriceData.Product.DefaultPriceScheduleID) {
                        OrderCloudSDK.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                            .then(function () {
                                _complete(true);
                            });
                    } else {
                        var options = {
                            userGroupID: SelectPriceData.UserGroup.ID
                        };
                        OrderCloudSDK.Products.DeleteAssignment(SelectPriceData.Product.ID, SelectPriceData.Buyer.ID, options)
                            .then(function () {
                                _complete(false);
                            });
                    }
                } else {
                    OrderCloudSDK.Products.SaveAssignment(assignment)
                        .then(function () {
                            if (!check.DoesExist && SelectPriceData.Product.SelectedPrice && SelectPriceData.Product.SelectedPrice.ID !== SelectPriceData.Product.DefaultPriceScheduleID) {
                                OrderCloudSDK.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                                    .then(function () {
                                        _complete(true);
                                    });
                            } else {
                                _complete(false);
                            }
                        })
                        .catch(function (ex) {
                            if (ex.response.body.Errors[0].ErrorCode === 'Product.CannotAssignNotInBuyerCatalog') {
                                //Product has not been assigned to the catalog
                                OrderCloudSDK.Catalogs.SaveProductAssignment({
                                    catalogID: SelectPriceData.Buyer.DefaultCatalogID,
                                    productID: SelectPriceData.Product.ID
                                }).then(function () {
                                    //Rerun select() now that product is assigned to catalog
                                    select();
                                });
                            } else {
                                df.reject(ex);
                            }
                        });
                }
            }
        }

        select();

        return df.promise;
    }

    function _removePrice(SelectPriceData, availablePriceSchedules) {
        var df = $q.defer();

        var check = _exists(SelectPriceData);

        if (check.DoesExist) {
            //delete assignment
            OrderCloudSDK.Products.DeleteAssignment(SelectPriceData.Product.ID, SelectPriceData.Buyer.ID, {
                    userGroupID: SelectPriceData.UserGroup ? SelectPriceData.UserGroup.ID : null
                })
                .then(function () {
                    _complete();
                })
                .catch(function (ex) {
                    df.reject(ex);
                });
        } else {
            //delete price
            OrderCloudSDK.PriceSchedules.Delete(SelectPriceData.Product.SelectedPrice.ID)
                .then(function () {
                    _complete();
                })
                .catch(function (ex) {
                    df.reject(ex);
                });
        }

        function _complete() {
            SelectPriceData.CurrentAssignments.splice(check.Index, 1);
            df.resolve({
                SelectedPrice: _.find(availablePriceSchedules, {
                    Inherited: true
                }),
                UpdatedAssignments: SelectPriceData.CurrentAssignments
            });
        }

        return df.promise;
    }

    return service;
}