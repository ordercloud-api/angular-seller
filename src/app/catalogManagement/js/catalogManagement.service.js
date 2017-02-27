angular.module('orderCloud')
    .factory('ocCatalogManagement', OrderCloudCatalogManagement)
;

function OrderCloudCatalogManagement($q, $uibModal, OrderCloud, ocConfirm) {
    var service = {
        CreateCategory: _createCategory,
        EditCategory: _editCategory,
        DeleteCategory: _deleteCategory,
        Products: {
            GetAssignments: _getProductAssignments,
            MapAssignments: _mapProductAssignments,
            CompareAssignments: _compareProductAssignments,
            UpdateAssignments: _updateProductAssignments
        }
    };

    function _createCategory(parentid, catalogid) {
        return $uibModal.open({
            templateUrl: 'catalogManagement/templates/catalogManagementCategoryCreate.modal.html',
            controller: 'CreateCategoryModalCtrl',
            controllerAs: 'createCategory',
            size: 'md',
            resolve: {
                ParentID: function() {
                    return parentid;
                },
                CatalogID: function() {
                    return catalogid;
                }
            }
        }).result;
    }

    function _editCategory(category, catalogid) {
        return $uibModal.open({
            templateUrl: 'catalogManagement/templates/catalogManagementCategoryEdit.modal.html',
            controller: 'EditCategoryModalCtrl',
            controllerAs: 'editCategory',
            size: 'md',
            resolve: {
                SelectedCategory: function() {
                    return category;
                },
                CatalogID: function() {
                    return catalogid;
                }
            }
        }).result;
    }

    function _deleteCategory(category, catalogid) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + category.Name + '</b>?',
                confirmText: 'Delete category',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Categories.Delete(category.ID, catalogid);
            });
    }

    function _getProductAssignments(categoryid, catalogid) {
        var deferred = $q.defer();
        var assignments = [];

        OrderCloud.Categories.ListProductAssignments(categoryid, null, 1, 100, catalogid)
            .then(function(data) {
                assignments = data.Items;
                var page = data.Meta.Page;
                var queue = [];
                while (page <= data.Meta.TotalPages) {
                    page++;
                    queue.push(OrderCloud.Categories.ListProductAssignments(categoryid, null, page, 100, catalogid));
                }
                $q.all(queue).then(function(results) {
                    angular.forEach(results, function(result) {
                        assignments = assignments.concat(result.Items);
                    });
                    deferred.resolve(assignments);
                });
            });

        return deferred.promise;
    }

    function _mapProductAssignments(allAssignments, productList) {
        productList.Items = _.map(productList.Items, function(product) {
            product.Assigned = false;
            angular.forEach(allAssignments, function(assignment) {
                if (product.ID == assignment.ProductID) product.Assigned = true;
            });
            return product;
        });
        return productList;
    }

    function _compareProductAssignments(allAssignments, productList, categoryID) {
        var changedAssignments = [];
        angular.forEach(productList.Items, function(product) {
            var existingAssignment = _.where(allAssignments, {ProductID: product.ID})[0];
            if (existingAssignment && !product.Assigned) {
                changedAssignments.push({
                    "old": existingAssignment,
                    "new": null
                })
            } else if (!existingAssignment && product.Assigned) {
                changedAssignments.push({
                    "old": null,
                    "new": {
                        ProductID: product.ID,
                        CategoryID: categoryID
                    }
                })
            }
        });

        return changedAssignments;
    }

    function _updateProductAssignments(allAssignments, changedAssignments, catalogid) {
        var deferred = $q.defer();
        var assignmentQueue = [];
        var errors = [];

        angular.forEach(changedAssignments, function(diff) {
            if (!diff.old && diff.new) {
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Categories.SaveProductAssignment(diff.new, catalogid) //create new category assignment
                        .then(function() {
                            allAssignments.push(diff.new); //add the new assignment to the assignment list
                            d.resolve();
                        })
                        .catch(function(ex) {
                            error.push(ex);
                            d.resolve();
                        });

                    return d.promise;
                })());
            }
            else if (diff.old && !diff.new) {
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Categories.DeleteProductAssignment(diff.old.CategoryID, diff.old.ProductID, catalogid)
                        .then(function() {
                            allAssignments.splice(allAssignments.indexOf(diff.old), 1); //remove the old assignment from the assignment list
                            d.resolve();
                        })
                        .catch(function(ex) {
                            errors.push(ex);
                            d.resolve();
                        });

                    return d.promise;
                })());
            }
        });

        $q.all(assignmentQueue).then(function() {
            deferred.resolve({UpdatedAssignments: allAssignments, Error: errors});
        });

        return deferred.promise;
    }

    return service;
}