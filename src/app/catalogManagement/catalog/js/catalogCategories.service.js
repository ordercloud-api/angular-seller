angular.module('orderCloud')
    .service('ocCatalogCategories', OrderCloudCatalogCategoriesSerivce)
;

function OrderCloudCatalogCategoriesSerivce($q, OrderCloudSDK) {
    var service = {
        GetAll: _getAllCategories,
        Assignments: {
            Get: _getAssignments,
            Map: _mapAssignments,
            Save: _saveAssignment,
            Delete: _deleteAssignment
        }
    };

    function _getAllCategories(catalogID) {
        var options = {
            pageSize: 100,
            depth: 'all'
        };
        return OrderCloudSDK.Categories.List(catalogID, options)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    options.page = currentPage;
                    queue.push(OrderCloudSDK.Categories.List(catalogID, options));
                }
                $q.all(queue)
                    .then(function(results) {
                        angular.forEach(results, function(r) {
                            data1.Items = data1.Items.concat(r.Items);
                        });
                        df.resolve(data1.Items);
                    });
                return df.promise;
            });
    }

    function _getAssignments(catalogID, buyerID, userGroupID) {
        var level = userGroupID ? 'group' : 'company';
        var options = {
            buyerID: buyerID,
            userGroupID: userGroupID,
            pageSize: 100,
            level: level
        };
        return OrderCloudSDK.Categories.ListAssignments(catalogID, options)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    options.page = currentPage;
                    queue.push(OrderCloudSDK.Categories.ListAssignments(catalogID, options));
                }
                $q.all(queue)
                    .then(function(results) {
                        angular.forEach(results, function(r) {
                            data1.Items = data1.Items.concat(r.Items);
                        });
                        df.resolve(data1.Items);
                    });
                return df.promise;
            });
    }

    function _mapAssignments(categoryList, currentAssignments, markInherited) {
        var copiedList = angular.copy(categoryList);
        if (!currentAssignments) return copiedList;
        if (currentAssignments === true) {
            _.map(copiedList, function(category) {
                category.Assigned = true;
            });
        } else if (currentAssignments) {
            var categoryIDs = _.map(currentAssignments, 'CategoryID');
            _.map(copiedList, function(category) {
                category.Assigned = categoryIDs.indexOf(category.ID) > -1;
                if (category.Assigned && markInherited) category.Inherited = true;
            });
        }
        return copiedList;
    }

    function _saveAssignment(catalogID, categoryID, buyerID, userGroupID) {
        var assignment = {
            categoryID: categoryID,
            buyerID: buyerID, 
            userGroupID: userGroupID,
            visible: true
        };
        return OrderCloudSDK.Categories.SaveAssignment(catalogID, assignment);
    }

    function _deleteAssignment(catalogID, categoryID, buyerID, userGroupID) {
        return OrderCloudSDK.Categories.DeleteAssignment(catalogID, categoryID, buyerID, {userGroupID: userGroupID});
    }

    return service;
}