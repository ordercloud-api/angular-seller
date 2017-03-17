angular.module('orderCloud')
    .factory('UploadService', UploadService)
;

function UploadService($q, $resource, $timeout, OrderCloud, devapiurl, catalogid) {
    var service = {
        Parse: _parse,
        Upload: _upload,
        UploadUsers: _uploadUsers,
        ReadFiles: _readFiles,
        ValidateProducts: _validateProducts,
        ValidateCategories: _validateCategories,
        ValidateUsers: _validateUsers,
        ValidateUserGroups: _validateUserGroups,
        ValidateAddress: _validateAddress,
        BuildXpObj: _buildXpObj,
        Combine: _combine
    };

    function _parse(files) {
        return _readFiles(files)
            .then(function(fileData) {
                return $resource(devapiurl + '/upload/parse', {}, {parse: {method: 'POST'}}).parse({Files: fileData}).$promise
                    .then(function(data) {
                        if(data.Data.UserFile) {
                            var userQueue = [];
                            var users = data.Data.UserFile;
                            var uniqueUserObjs = _.groupBy(users, 'id');
                            _.each(uniqueUserObjs, function(userArr){
                                if(userArr.length > 0) {
                                    userArr[0].store_location_id = _.pluck(userArr, 'store_location_id');
                                    userQueue.push(userArr[0]);
                                }
                            });
                            data.Data.UserFile = userQueue;
                        } else {
                            return data.Data;
                        }
                        return data.Data;
                    });
            });
    }

    function _readFiles(files) {
        var results = angular.copy(files);
        var deferred = $q.defer();

        if(files.length) {
            readFile(0);
        } else {
            deferred.reject('There are no files');
        }

        return deferred.promise;

        function readFile(index) {
            var key = _.keys(results[index])[0];
            var reader = new FileReader();
            var file = files[index][key].target.files;

            reader.onload = function(e) {
                var data = e.target.result;
                results[index][key] = data;

                if(index === files.length - 1) {
                    deferred.resolve(results);
                } else {
                    readFile(index + 1);
                }
            };
            reader.readAsText(file[0]);
        }
    }

    function _upload(products, categories) {
        var deferred = $q.defer();
        var successfulProducts = [];
        var successfulCats = [];
        var results = {
            FailedProducts: [],
            FailedCategories: [],
            FailedPriceSchedules: [],
            FailedProductBuyerAssignments: [],
            SkippedCategoryAssignments: [],
            FailedCategoryAssignments: []
        };
        var productCount = products.length;
        var categoryCount = categories.length;
        var progress = [{Message: 'Clean Price Schedules', Total: productCount, SuccessCount: 0, ErrorCount: 0}];

        $timeout(function() {
            deleteProductPriceSchedules();
        }, 1000);

        function deleteProductPriceSchedules() {
            deferred.notify(progress);
            var deletePSQueue = [];
            angular.forEach(products, function(product) {
                deletePSQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.PriceSchedules.Delete(product.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });
                    return d.promise;
                })());
            });

            $q.all(deletePSQueue).then(function() {
                createProducts();
            });
        }

        function createProducts() {
            progress.push({Message: 'Upload Products', Total: productCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var productQueue = [];
            angular.forEach(products, function(product) {
                var p = {
                    ID: product.ID,
                    Name: product.Name,
                    Description: product.Description,
                    QuantityMultiplier: product.QuantityMultiplier || 1,
                    Active: 'true',
                    ShipFromAddressID: product.ShipFromAddressID,
                    xp: {
                        url_detail: product.xp.url_detail,
                        image: {
                            URL: product.xp.image.URL
                        },
                        description_short: product.xp.description_short,
                        attributes: product.xp.attributes
                    }
                };
                productQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Products.Update(p.ID, p)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            successfulProducts.push(product);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedProducts.push({ProductID: p.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });

                    return d.promise;
                })());
            });

            $q.all(productQueue).then(function() {
                products = successfulProducts;
                productCount = products.length;
                createPriceSchedules();
            });
        }

        function createPriceSchedules() {
            progress.push({Message: 'Upload Price Schedules', Total: productCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var priceScheduleQueue = [];
            angular.forEach(products, function(product) {
                var ps = {
                    ID: product.ID,
                    Name: product.ID + ' - ' + product.Price,
                    ApplyTax: false,
                    ApplyShipping: false,
                    RestrictedQuantity: false,
                    UseCumulativeQuantity: false,
                    PriceBreaks: [{Quantity: 1, Price: product.Price}],
                    xp: {}
                };
                priceScheduleQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.PriceSchedules.Update(ps.ID, ps)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedPriceSchedules.push({PriceScheduleID: ps.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });

                    return d.promise;
                })());
            });

            $q.all(priceScheduleQueue).then(function() {
                gatherBuyers();
            });
        }

        function gatherBuyers() {
            progress.push({Message: 'Fetch Buyers', Total: 1, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var buyerIDs = [];
            OrderCloud.Buyers.List(null, 1, 100)
                .then(function(buyerData) {
                    progress[progress.length - 1].Total = buyerData.Meta.TotalPages;
                    progress[progress.length - 1].SuccessCount++;
                    deferred.notify(progress);
                    buyerIDs = buyerIDs.concat(_.pluck(buyerData.Items, 'ID'));
                    if (buyerData.Meta.TotalPages > buyerData.Meta.Page) {
                        var buyerQueue = [];
                        var page = buyerData.Meta.Page;
                        while (page < buyerData.Meta.TotalPages) {
                            page++;
                            buyerQueue.push((function() {
                                var d = $q.defer();

                                OrderCloud.Buyers.List(null, page, 100)
                                    .then(function() {
                                        progress[progress.length - 1].SuccessCount++;
                                        deferred.notify(progress);
                                        d.resolve();

                                    })
                                    .catch(function(ex) {
                                        progress[progress.length - 1].ErrorCount++;
                                        deferred.notify(progress);
                                        d.resolve();
                                    });

                                return d.promise;
                            })());
                        }
                        $q.all(buyerQueue).then(function(buyerResults) {
                            angular.forEach(buyerResults, function(result) {
                                buyerIDs = buyerIDs.concat(_.pluck(result.Items, 'ID'));
                            });
                            assignProductsToBuyers(buyerIDs);
                        });
                    }
                    else {
                        assignProductsToBuyers(buyerIDs);
                    }
                });
        }

        function assignProductsToBuyers(bIDs) {
            progress.push({Message: 'Assign Products to Buyers', Total: productCount * bIDs.length, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var buyerAssignmentQueue = [];
            _.each(products, function(product) {
                _.each(bIDs, function(buyerID) {
                    var assignment = {
                        BuyerID: buyerID,
                        ProductID: product.ID,
                        PriceScheduleID: product.ID
                    };
                    buyerAssignmentQueue.push((function() {
                        var d = $q.defer();

                        OrderCloud.Products.SaveAssignment(assignment)
                            .then(function() {
                                progress[progress.length - 1].SuccessCount++;
                                deferred.notify(progress);
                                d.resolve();
                            })
                            .catch(function(ex) {
                                progress[progress.length - 1].ErrorCount++;
                                deferred.notify(progress);
                                results.FailedProductBuyerAssignments.push({BuyerID: buyerID, ProductID: product.ID, Error: {Code: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                d.resolve();
                            });

                        return d.promise;
                    })());
                });
            });
            $q.all(buyerAssignmentQueue).then(function() {
                createCategories();
            });
        }

        function createCategories() {
            progress.push({Message: 'Creating Categories', Total: categoryCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var categoryQueue = [];

            angular.forEach(categories, function(category) {
                var cat = {
                    ID: category.ID,
                    Name: category.Name,
                    Active: 'true'
                };
                categoryQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Categories.Update(cat.ID, cat, catalogid)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            successfulCats.push(category);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedCategories.push({CategoryID: cat.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });
                    return d.promise;
                })());
            });

            $q.all(categoryQueue).then(function() {
                categories = successfulCats;
                categoryCount = categories.length;
                setParentID();
            })
        }

        function setParentID() {
            var categoryQueue = [];
            angular.forEach(categories, function(category) {
                categoryQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Categories.Patch(category.ID, {ParentID: category.ParentID}, catalogid)
                        .then(function() {
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            deferred.notify(progress);
                            d.resolve();
                        });

                    return d.promise;
                })());
            });

            $q.all(categoryQueue).then(function() {
                buildCategoryAssignmentQueue(categories);
            });
        }

        function buildCategoryAssignmentQueue(allCategories) {
            var categoryAssignments = [];

            _.each(products, function(product) {
                var directCategory = _.findWhere(allCategories, {ID: product.CategoryID});

                function checkParent(cat) {
                    var parentCat = _.findWhere(allCategories, {ID: cat.ParentID});
                    if (parentCat) {
                        var parentAssignment = {
                            CategoryID: parentCat.ID,
                            ProductID: product.ID
                        };
                        categoryAssignments.push(parentAssignment);
                        if (parentCat.ParentID) checkParent(parentCat);
                    }
                    else {
                        results.SkippedCategoryAssignments.push({CategoryID: cat.ID, ProductID: product.ID, Error: {Message: 'Category does not exist: ' + cat.ID}});
                    }
                }
                if (directCategory) {
                    var assignment = {
                        CategoryID: directCategory.ID,
                        ProductID: product.ID
                    };
                    categoryAssignments.push(assignment);
                    if (directCategory.ParentID) checkParent(directCategory);
                }
                else {
                    results.SkippedCategoryAssignments.push({CategoryID: product.CategoryID, ProductID: product.ID, Error: {Message: 'Category does not exist: ' + product.CategoryID}});
                }
            });
            assignProductsToCategories(categoryAssignments);
        }

        function assignProductsToCategories(categoryAssignments) {
            progress.push({Message: 'Assign Products to Categories', Total: categoryAssignments.length, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var categoryAssignmentQueue = [];
            _.each(categoryAssignments, function(catAss) {
                categoryAssignmentQueue.push( (function() {
                    var d = $q.defer();
                        OrderCloud.Categories.SaveProductAssignment(catAss, catalogid)
                            .then(function() {
                                progress[progress.length - 1].SuccessCount++;
                                deferred.notify(progress);
                                d.resolve();
                            })
                            .catch(function(ex) {
                                progress[progress.length - 1].ErrorCount++;
                                deferred.notify(progress);
                                results.FailedCategoryAssignments.push({CategoryID: catAss.CategoryID, ProductID: product.ID, Error: {Code: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                d.resolve();
                            });
                    return d.promise;
                    }) ());
                });
            $q.all(categoryAssignmentQueue).then(function() {
                progress.push({Message: 'Done'});
                deferred.notify(progress);
                finish();
            });
        }

        function finish() {
            results.TotalErrorCount = results.FailedProducts.length + results.FailedPriceSchedules.length + results.FailedProductBuyerAssignments.length + results.FailedCategoryAssignments.length;
            deferred.resolve(results);
        }

        return deferred.promise;
    }

    function _uploadUsers(buyer, users, userGroups, addresses) {
        var deferred = $q.defer();
        var successfulUsers = [];
        var successfulUserGroups = [];
        var successfulAddresses = [];

        var results = {
            FailedUsers: [],
            FailedUserGroups: [],
            FailedAddresses: [],
            FailedUserAssignments: [],
            FailedAddressAssignments: []
        };

        var userCount = users.length;
        var userGroupCount = userGroups.UserGroups.length;
        var addressCount = addresses.Address.length;
        var progress = [{Message: 'Uploading Users, User Groups, and Addresses', Total: userGroupCount + addressCount, SuccessCount: 0, ErrorCount: 0}];

        $timeout(function() {
            createUsers();
        }, 1000);

        function createUsers() {
            progress.push({Message: 'Upload Users', Total: userCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var userQueue = [];
            _.each(users.Users, function(user) {
                var userBody = {
                    ID: user.ID,
                    Username: user.Username,
                    FirstName: user.FirstName,
                    LastName: user.LastName,
                    Email: user.Email,
                    Phone: user.Phone,
                    Active: user.Active.toLowerCase() === 'true',
                    xp: {
                        Locations: user.xp.Locations
                    }
                };
                userQueue.push( (function() {
                    var d = $q.defer();

                    OrderCloud.Users.Update(userBody.ID, userBody, buyer.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            successfulUsers.push(userBody);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedUsers.push({UserID: userBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}})
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });
                    return d.promise;
                }) ());
            });

            $q.all(userQueue)
                .then(function() {
                    users = successfulUsers;
                    userCount = users.length;
                    createUserGroups();
                })
        }

        function createUserGroups() {
            progress.push({Message: 'Upload User Groups', Total: userGroupCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var userGroupQueue = [];
            _.each(userGroups.UserGroups, function(userGroup) {
                var userGroupBody = {
                    ID: userGroup.ID,
                    Name: userGroup.Name
                };

                userGroupQueue.push( (function() {
                    var d = $q.defer();

                    OrderCloud.UserGroups.Update(userGroupBody.ID, userGroupBody, buyer.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            if(ex.status === 404) {
                                OrderCloud.UserGroups.Create(userGroupBody, buyer.ID)
                                    .then(function() {
                                        progress[progress.length - 1].SuccessCount++;
                                        deferred.notify(progress);
                                        d.resolve();
                                    })
                                    .catch(function(ex){
                                        results.FailedUserGroups.push({UserGroupID: userGroupBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                        progress[progress.length - 1].ErrorCount++;
                                        deferred.notify(progress);
                                        d.resolve();
                                    })
                            } else {
                                results.FailedUserGroups.push({UserGroupID: userGroupBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                progress[progress.length - 1].ErrorCount++;
                                deferred.notify(progress);
                                d.resolve();
                            }
                        });
                    return d.promise;
                })());
            });

            $q.all(userGroupQueue)
                .then(function() {
                    successfulUserGroups = userGroups.UserGroups;
                    userGroupCount = userGroups.UserGroups.length;
                    saveUserAssignment(successfulUsers, userGroups);
                })
        }

        function saveUserAssignment(users, groups) {
            progress.push({Message: 'Assign Users to User Groups', Total: users.length, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var groupAssignmentQueue = [];
            _.each(users, function(user) {
                groupAssignmentQueue.push( (function() {
                    var d = $q.defer();
                    var assignedLocationIDs = user.xp.Locations;
                    _.each(assignedLocationIDs, function(id) {
                        var matchedID = _.findWhere(groups.UserGroups, {ID: id});
                        if(matchedID) {
                            var assignment = {
                                UserID: user.ID,
                                UserGroupID: matchedID.ID
                            };
                            OrderCloud.UserGroups.SaveUserAssignment(assignment, buyer.ID)
                                .then(function() {
                                    progress[progress.length - 1].SuccessCount++;
                                    deferred.notify(progress);
                                    d.resolve();
                                })
                                .catch(function(ex) {
                                    progress[progress.length - 1].ErrorCount++;
                                    deferred.notify(progress);
                                    results.FailedUserAssignments.push({UserID: assignment.UserID, UserGroupID: assignment.UserGroupID, Error: {Code: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                    d.resolve();
                                });
                        } else {
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            results.FailedUserAssignments.push({UserID: user.ID, UserGroupID: matchedID.ID, Message: 'An error occurred while assigning this User to a matching User Group'});
                            d.resolve();
                        }
                    });
                    return d.promise;
                })());
            });
            $q.all(groupAssignmentQueue)
                .then(function() {
                    //successfulUserAssignments = userGroups.UserGroups;
                    //userGroupCount = userGroups.UserGroups.length;
                    createAddresses();
                });
        }

        function createAddresses() {
            progress.push({Message: 'Upload Addresses', Total: addressCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var addressQueue = [];
            _.each(addresses.Address, function(address) {
                var addressBody = {
                    ID: address.ID,
                    CompanyName: address.CompanyName,
                    Street1: address.Street1,
                    Street2: address.Street2,
                    City: address.City,
                    State: address.State,
                    Zip: address.Zip,
                    Country: address.Country,
                    Phone: address.Phone,
                    AddressName: address.AddressName
                };
                addressQueue.push( (function(){
                    var d = $q.defer();

                    OrderCloud.Addresses.Update(addressBody.ID, addressBody, buyer.ID)
                        .then(function() {
                            progress[progress.length -1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedAddresses.push({AddressID: addressBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}})
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });
                    return d.promise;
                })());
            });

            $q.all(addressQueue)
                .then(function() {
                    successfulAddresses = addresses.Address;
                    addressCount = addresses.Address.length;
                    buildAddressAssignment(successfulUserGroups, successfulAddresses);
                })
        }

        function buildAddressAssignment(groups, addresses) {
            var addressAssignments = [];

            _.each(groups, function(group) {
                var matchingID = _.findWhere(addresses, {CompanyName: group.ID});
                if(matchingID) {
                    var assignment = {
                        IsShipping: true,
                        ISBilling: false,
                        AddressID: matchingID.ID,
                        UserGroupID: group.ID
                    };
                    addressAssignments.push(assignment);
                } else {
                    results.FailedAddressAssignments.push({UserGroupID: group.ID, Error: {Message: 'The Address for Group ' + group.ID + ' does not exist'}})
                }
            });
            saveAddressAssignment(addressAssignments);
        }

        function saveAddressAssignment(assignments) {
            progress.push({Message: 'Assign Addresses to User Groups', Total: assignments.length, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var addressAssignmentQueue = [];
            _.each(assignments, function(assignment) {
                addressAssignmentQueue.push( (function() {
                    var d = $q.defer();
                    OrderCloud.Addresses.SaveAssignment(assignment, buyer.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            results.FailedCategoryAssignments.push({AddressID: assignment.AddressID, UserGroupID: assignment.GroupID, Error: {Code: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                            d.resolve();
                        });
                    return d.promise;
                })());
            });
        }
        return deferred.promise;
    }

    function _validateProducts(products, mapping) {
        var result = {};
        result.Products = [];
        result.ProductIssues = [];

        _.each(products, function(product) {
            validateSingleProduct(product)
        });
        return result;

        function validateSingleProduct(product) {
            function findCategoryID(product) {
                var category = null;
                _.each(product.attributes, function(value) {
                    var key = _.keys(value)[0];
                    if(key === 'category_id') category = value;
                });
                return category.category_id;
            }

            var p = {
                ID: product[mapping.ID],
                Name: product[mapping.Name],
                Description: product[mapping.Description],
                QuantityMultiplier: product[mapping.QuantityMultiplier],
                ShipWeight: product[mapping.ShipWeight],
                ShipHeight: product[mapping.ShipHeight],
                ShipWidth: product[mapping.ShipWidth],
                ShipLength: product[mapping.ShipLength],
                Active: product[mapping.Active],
                Type: product[mapping.Type],
                InventoryEnabled: product[mapping.InventoryEnabled],
                InventoryNotificationPoint: product[mapping.InventoryNotificationPoint],
                VariantLevelInventory: product[mapping.VariantLevelInventory],
                xp: _buildXpObj(product, mapping),
                AllowOrderExceedInventory: product[mapping.AllowOrderExceedInventory],
                InventoryVisible: product[mapping.InventoryVisible],
                ShipFromAddressID: product[mapping.ShipFromAddressID],
                CategoryID: product[mapping.CategoryID],
                Price: product[mapping.Price]
            };
            result.Products.push(p);

            if (!p.ID) {
                result.ProductIssues.push({
                    ProductID: p.ID,
                    ProductName: p.Name,
                    Issue: 'Product: ' + p.Name + ' does not have an ID'
                });
            }
            if (!isValid(p.ID)) {
                result.ProductIssues.push({
                    ProductID: p.ID,
                    ProductName: p.Name,
                    Issue: 'Product: ' + p.ID + ' ID has special characters'
                });
            }
            if (!p.Name) {
                result.ProductIssues.push({
                    ProductID: p.ID,
                    ProductName: p.Name,
                    Issue: 'Product: ' + p.ID + ' does not have a Name'
                });
            }
            if (!p.Price) {
                result.ProductIssues.push({
                    ProductID: p.ID,
                    ProductName: p.Name,
                    Issue: 'Product: ' + p.Name + ' does not have a price'
                });
            }
            if (p.Price && !isNumber(p.Price)) {
                result.ProductIssues.push({
                    ProductID: p.ID,
                    ProductName: p.Name,
                    Issue: 'Product: ' + p.Name + ' Price is not a number: ' + p.Price
                });
            }
        }
    }

    function _validateCategories(categories, mapping) {
        var result = {};
        result.Categories = [];
        result.CategoryIssues = [];

        var categoryList = angular.copy(categories);
        //Category Data that has not been mapped

        _.each(categories, function(category) {
            validateSingleCat(category);
        });

        function validateSingleCat(category) {
            var cat = {
                ID: category[mapping.ID],
                Name: category[mapping.Name],
                ParentID: category[mapping.ParentID] || null
            };

            function hasParent(currentCat) {
                return _.some(categoryList, function(category){
                    return category[mapping.ID] === currentCat.ParentID;
                });
            }

            result.Categories.push(cat);

            if (!cat.ID) {
                result.CategoryIssues.push({
                    CategoryID: cat.ID,
                    CategoryName: cat.Name,
                    Issue: 'Category: ' + cat.Name + ' does not have an ID'
                });
            }
            if (cat.ParentID && !hasParent(cat)) {
                result.CategoryIssues.push({
                    CategoryID: cat.ID,
                    CategoryName: cat.Name,
                    Issue: 'Category: ' + cat.Name + ' has a ParentID of a Category that does not exist'
                });
            }
            if (!isValid(cat.ID)) {
                result.CategoryIssues.push({
                    CategoryID: cat.ID,
                    CategoryName: cat.Name,
                    Issue: 'Category: ' + cat.ID + ' has special characters'
                });
            }
            if (!cat.Name) {
                result.CategoryIssues.push({
                    CategoryID: cat.ID,
                    CategoryName: cat.Name,
                    Issue: 'Category: ' + cat.ID + ' does not have a Name'
                });
            }
        }
        return result;
    }

    function _validateUsers(users, mapping) {
        var result = {};
        result.Users = [];
        result.UserIssues = [];

        _.each(users, function(user) {
            validateSingleUser(user);
        });

        function validateSingleUser(user) {
            var userData = {
                ID: user[mapping.ID],
                Username: user[mapping.Username],
                FirstName: user[mapping.FirstName],
                LastName: user[mapping.LastName],
                Email: user[mapping.Email],
                Phone: user[mapping.Phone],
                Active: user[mapping.Active],
                xp: _buildXpObj(user, mapping)
            };

            result.Users.push(userData);

            if (!userData.ID) {
                result.UserIssues.push({
                    ID: userData.ID,
                    Username: userData.Username,
                    Issue: 'User: ' + userData.Username + ' does not have an ID'
                });
            }
            if (!isValid(userData.ID)) {
                result.UserIssues.push({
                    ID: userData.ID,
                    Username: userData.Username,
                    Issue: 'User: ' + userData.Username + ' has special characters'
                });
            }
            if(!userData.Username) {
                result.UserIssues.push({
                    ID: userData.ID,
                    Username: userData.Username,
                    Issue: 'User ' + userData.ID + ' does not have a Username'
                });
            }
        }
        return result
    }

    function _validateUserGroups(groups, mapping) {
        var result = {};
        result.UserGroups = [];
        result.UserGroupIssues = [];

        _.each(groups, function(group) {
            validateSingleGroup(group)
        });

        function validateSingleGroup(group) {
            var userGroupData = {
                ID: group[mapping.ID],
                Name: group[mapping.Name]
            };

            result.UserGroups.push(userGroupData);

            if (!userGroupData.ID) {
                result.UserGroupIssues.push({
                    ID: userGroupData.ID,
                    Issue: 'User Group: ' + userGroupData.Name + ' does not have an ID'
                });
            }
            if (!isValid(userGroupData.ID)) {
                result.UserGroupIssues.push({
                    ID: userGroupData.ID,
                    Issue: 'User Group: ' + userGroupData.Name + ' has an invalid ID'
                });
            }
        }
        return result;
    }

    function _validateAddress(addresses, mapping) {
        var result = {};
        result.Address = [];
        result.AddressIssues = [];

        _.each(addresses, function(address) {
            validateSingleAddress(address);
        });

        function validateSingleAddress(address) {
            var addressData = {
                ID: address[mapping.ID],
                CompanyName: address[mapping.CompanyName],
                Street1: address[mapping.Street1],
                Street2: address[mapping.Street2],
                City: address[mapping.City],
                State: address[mapping.State],
                Zip: address[mapping.Zip],
                Country: address[mapping.Country],
                Phone: address[mapping.Phone],
                AddressName: address[mapping.AddressName]
            };

            result.Address.push(addressData);

            if (!isValid(addressData.ID)) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' has an invalid ID'
                });
            }
            if(!addressData.Street1) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' does not have a Street'
                })
            }
            if(!addressData.City) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' does not have a City'
                })
            }
            if(!addressData.State) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' does not have a State'
                })
            }
            if(!addressData.Zip) {
                result.AddressIssues.push({
                    CompanyName: addressData.Zip,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.Zip + ' does not have a Zip Code'
                })
            }
            if(!addressData.Country) {
                result.AddressIssues.push({
                    CompanyName: addressData.Zip,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.Zip + ' does not have a Country'
                })
            }
        }
        return result;
    }

    function _buildXpObj(object, mapping){
        var result = {};
        var xpKeyPaths = [];

        //get all xp keyPaths that have a value, ex: xp.image.URL
        _.each(mapping, function(value, key){
            var isXP = key.indexOf('xp') > -1;
            if(isXP && object[mapping[key]]) xpKeyPaths.push(key);
        });

        //build up xp obj then set xp value
        _.each(xpKeyPaths, function(path){
            var keys = path.split('.'); //[xp, image, URL]
            _.reduce(keys, function(node, value){
                return node[value] || (node[value] = {});
            }, result);

            setXPValue(result, keys, object[mapping[path]]);
        });

        return result.xp || null;

        function setXPValue(result, keys, value){
            if(keys.length > 1){
                setXPValue(result[keys.shift()], keys, value);
            } else{
                result[keys[0]] = value;
            }
        }
    }

    function isValid(str) {
        return !/[~`!#$%\^&*+=\\[\]\\';.,/{}|\\":<>\?]/g.test(str);
    }


    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _combine(prodCollection, attrCollection) {
        var formatted = [];
        var result = {};

        _.each(attrCollection, function(attr) {
            var attribute = {};
            attribute.unique_id = attr.unique_id;
            attribute[attr.key] = attr.value;
            formatted.push(attribute);
        });
        var groupedAttrs = _.groupBy(formatted, 'unique_id');
        _.each(groupedAttrs, function(group) {
            _.each(group, function(attr) {
                delete attr.unique_id;
            })
        });
        _.each(groupedAttrs, function(group, index) {
            var product = _.findWhere(prodCollection, {unique_id: index});
            if(product) {
                product.attributes = group;
                product.CategoryID = findCategoryID(product.attributes);
            }
            function findCategoryID(attributes) {
                var category = _.find(attributes, function(attribute){
                    return _.has(attribute, 'category_id');
                });
                return category ? category.category_id : null;
            }
        });
        result.productData = prodCollection;
        result.attrData = attrCollection;

        return result;
    }

    return service;
}