angular.module('orderCloud')
    .factory('ProductUploadService', ProductUploadService)
;

function ProductUploadService($q, $timeout, OrderCloud, catalogid, UploadService) {
    var service = {
        Upload: _upload,
        ValidateProducts: _validateProducts,
        ValidateCategories: _validateCategories,
        Combine: _combine
    };

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
                xp: UploadService.BuildXpObj(product, mapping),
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
            if (!UploadService.IsValid(p.ID)) {
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
            if (p.Price && !UploadService.IsNumber(p.Price)) {
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
            if (!UploadService.IsValid(cat.ID)) {
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