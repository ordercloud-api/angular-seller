angular.module('orderCloud')
    .factory('ocRelatedProducts', OrderCloudRelatedProductsService)
;

function OrderCloudRelatedProductsService($q, $log, OrderCloudSDK) {
    var service = {
        List: _list, //Map a list of products to a desired products xp.RelatedProducts, all parameters are used.
        Map: _map, //Manually map a product list response to an array of related product IDs (this will add a product.Related boolean)
        Toggle: _toggle, //Add/remove a product to the product currently stored in currentProductID (initialized by the list method)
        Sync: _sync //Sync an ID change of a product to it's related product's (xp.RelatedProducts array)
    };

    var relatedProducts,
        currentProductID;        

    function _hasRelatedProducts(product) {
        return (product.xp && product.xp.RelatedProducts && Object.prototype.toString.call(product.xp.RelatedProducts) === '[object Array]' && product.xp.RelatedProducts.length);
    }

    function _list(product, parameters) {
        if (!currentProductID || currentProductID !== product.ID) {
            currentProductID = product.ID;
            relatedProducts = (_hasRelatedProducts(product) ? _.compact(product.xp.RelatedProducts) : []);
        }
        var options = angular.extend(parameters, {filters:{ID:'!' + product.ID}});
        return OrderCloudSDK.Products.List(options)
            .then(function(data) {
                return service.Map(data, relatedProducts);
            });
    }

    function _map(productList, relatedProducts) {
        if (!relatedProducts || !relatedProducts.length) return productList;
        angular.forEach(productList.Items, function(product) {
            product.Related = _.filter(relatedProducts, function(relatedID) {return relatedID === product.ID;}).length > 0;
        });
        return productList;
    }

    function _toggle(product) {
        var df = $q.defer();
        var newRelatedProducts = angular.copy(relatedProducts),
            newOtherRelatedProducts = _hasRelatedProducts(product) ? _.compact(product.xp.RelatedProducts) : [],
            shouldUpdateOther = true,
            wasAdded;

        function _updateRelatedProductsArray(array, productID, shouldMatch) {
            var index = array.indexOf(productID);
            if (shouldMatch) {
                if (wasAdded && index === -1) {
                    array.push(productID);
                } else if (!wasAdded && index > -1) {
                    array.splice(index, 1);
                } else {
                    shouldUpdateOther = false;
                }
            } else if (index > -1) {
                array.splice(index, 1);
                wasAdded = false;
            } else {
                array.push(productID);
                wasAdded = true;
            }
        }

        _updateRelatedProductsArray(newRelatedProducts, product.ID, false);
        _updateRelatedProductsArray(newOtherRelatedProducts, currentProductID, true);

        OrderCloudSDK.Products.Patch(currentProductID, {xp: {RelatedProducts: newRelatedProducts}})
            .then(function() {
                if (shouldUpdateOther) {
                    OrderCloudSDK.Products.Patch(product.ID, {xp: {RelatedProducts: newOtherRelatedProducts}})
                        .then(function() {
                            relatedProducts = newRelatedProducts;
                            df.resolve(wasAdded);
                        });
                } else {
                    relatedProducts = newRelatedProducts;
                    df.resolve(wasAdded);
                }
            })
            .catch(function(ex) {
                df.reject(ex);
            });

        return df.promise;
    }

    function _sync(relatedProductIDs, newProductID, oldProductID) {
        var df = $q.defer(),
            queue = [];

        if (!relatedProductIDs || (relatedProductIDs && !relatedProductIDs.length))  {
            df.resolve();
        } else {
            OrderCloudSDK.Products.List({filters: {ID:relatedProductIDs.join('|')}})
                .then(function(data) {
                    _createUpdateQueue(data.Items);
                    $q.all(queue)
                        .then(function(results) {
                            angular.forEach(results, function(r) {
                                if (!r.Success) $log('Related products sync on ' + oldProductID + '=>' + newProductID + ' failed for ' + r.ProductID);
                            });
                            df.resolve();
                        });
                });
        }


        function _createUpdateQueue(relatedProducts) {
            angular.forEach(relatedProducts, function(product) {
                var newArray;
                if (!_hasRelatedProducts(product)) {
                    newArray = [newProductID];
                } else if (_oldProductPresent(product)) {
                    newArray = angular.copy(product.xp.RelatedProducts);
                    newArray[newArray.indexOf(oldProductID)] = newProductID;
                } else {
                    newArray = angular.copy(product.xp.RelatedProducts);
                    newArray.push(newProductID);
                }
                queue.push(_updateXP(product.ID, _.compact(newArray)));
            });
        }

        function _updateXP(productID, relatedProductsArray) {
            var defer = $q.defer();
            OrderCloudSDK.Products.Patch(productID, {xp: {RelatedProducts:relatedProductsArray}})
                .then(function() {
                    defer.resolve({ProductID: productID, Success:true});
                })
                .catch(function() {
                    defer.resolve({ProductID: productID, Success:false});
                });

            return defer.promise;
        }

        function _oldProductPresent(product) {
            return (product.xp.RelatedProducts.indexOf(oldProductID) > -1);
        }

        return df.promise;
    }

    return service;
}