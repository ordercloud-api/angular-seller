angular.module('orderCloud')
    .factory('ocProductCategories', OrderCloudProductCategoriesService)
;

function OrderCloudProductCategoriesService($q, OrderCloudSDK) {
    var service = {
        Assignments: {
            Get: _get,
            Save: _save,
            Delete: _delete
        }
    };

    function _get(catalogID, productID) {
        var df = $q.defer();

        var options = {
            productID: productID,
            pageSize: 100
        };
        OrderCloudSDK.Categories.ListProductAssignments(catalogID, options)
            .then(function(data) {
                if (data.Meta.TotalPages == 1) {
                    df.resolve(data.Items);
                }
                else {
                    var queue = [],
                    totalPages = angular.copy(data.Meta.TotalPages),
                    currentPage = angular.copy(data.Meta.Page);
                    while (currentPage < totalPages) {
                        currentPage++;
                        options.page = currentPage;
                        queue.push(OrderCloudSDK.Categories.ListProductAssignments(catalogID, options));
                    }
                    $q.all(queue)
                        .then(function(results) {
                            angular.forEach(results, function(r) {
                                data.Items = data.Items.concat(r.Items);
                            });
                            df.resolve(data.Items);
                        });
                }
            });

        return df.promise;
    }

    function _save(catalogID, categoryID, productID) {
        var assignment = {
            categoryID: categoryID,
            productID: productID
        };
        return OrderCloudSDK.Categories.SaveProductAssignment(catalogID, assignment);
    }

    function _delete(catalogID, categoryID, productID) {
        return OrderCloudSDK.Categories.DeleteProductAssignment(catalogID, categoryID, productID);
    }

    return service;
}