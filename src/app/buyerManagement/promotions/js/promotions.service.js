angular.module('orderCloud')
    .factory('ocPromotions', OrderCloudPromotions)
;

function OrderCloudPromotions($q, $uibModal, ocConfirm, OrderCloud) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete,
        Assignments: {
            Get: _getAssignments,
            Map: _mapAssignments,
            Compare: _compareAssignments,
            Update: _updateAssignments
        }
    };

    function _create(buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/promotions/templates/promotionCreate.modal.html',
            controller: 'PromotionCreateModalCtrl',
            controllerAs: 'promotionCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _edit(promotion, buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/promotions/templates/promotionEdit.modal.html',
            controller: 'PromotionEditModalCtrl',
            controllerAs: 'promotionEditModal',
            bindToController: true,
            resolve: {
                SelectedPromotion: function() {
                    return promotion
                },
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _delete(promotion, buyerid) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + (promotion.Name ? promotion.Name : promotion.Code) + '</b>?',
                confirmText: 'Delete promotion',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Promotions.Delete(promotion.ID, buyerid)
            })
    }

    function _getAssignments(level, buyerid, usergroupid) {
        return OrderCloud.Promotions.ListAssignments(null, null, usergroupid, level, null, 100, buyerid)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    queue.push(OrderCloud.Promotions.ListAssignments(null, null, usergroupid, level, currentPage, 100, buyerid));
                }
                $q.all(queue)
                    .then(function(results) {
                        angular.forEach(results, function(r) {
                            data1.Items = data1.Items.concat(r.Items);
                        });
                        df.resolve(data1.Items);
                    });
                return df.promise;
            })
    }

    function _mapAssignments(allAssignments, promotionList, buyerID) {
        promotionList.Items = _.map(promotionList.Items, function(promotion) {
            promotion.Assigned = false;
            angular.forEach(allAssignments, function(assignment) {
                if (promotion.ID == assignment.PromotionID && buyerID == assignment.BuyerID) promotion.Assigned = true;
            });
            return promotion;
        });

        return promotionList;
    }

    function _compareAssignments(allAssignments, promotionList, userGroupID, buyerID) {
        var changedAssignments = [];
        angular.forEach(promotionList.Items, function(promotion) {
            var existingAssignment = _.where(allAssignments, {PromotionID:promotion.ID, BuyerID:buyerID})[0];
            if (existingAssignment && !promotion.Assigned) {
                changedAssignments.push({
                    "old": existingAssignment,
                    "new": null
                })
            } else if (!existingAssignment && promotion.Assigned) {
                changedAssignments.push({
                    "old": null,
                    "new": {
                        BuyerID: buyerID,
                        UserGroupID: userGroupID,
                        PromotionID: promotion.ID
                    }
                })
            }
        });

        return changedAssignments;
    }

    function _updateAssignments(allAssignments, changedAssignments) {
        var df = $q.defer(),
            assignmentQueue = [],
            errors = [];

        angular.forEach(changedAssignments, function(diff) {
            if (!diff.old && diff.new) {
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Promotions.SaveAssignment(diff.new) // -- Create new User Assignment
                        .then(function() {
                            allAssignments.push(diff.new); //add the new assignment to the assignment list
                            d.resolve();
                        })
                        .catch(function(ex) {
                            errors.push(ex);
                            d.resolve();
                        });

                    return d.promise;
                })())
            } else if (diff.old && !diff.new) { // -- Delete existing User Assignment
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Promotions.DeleteAssignment(diff.old.PromotionID, null, diff.old.UserGroupID, diff.old.BuyerID)
                        .then(function() {
                            allAssignments.splice(allAssignments.indexOf(diff.old), 1); //remove the old assignment from the assignment list
                            d.resolve();
                        })
                        .catch(function(ex) {
                            errors.push(ex);
                            d.resolve();
                        });

                    return d.promise;
                })())
            }
        });

        $q.all(assignmentQueue)
            .then(function() {
                df.resolve({
                    UpdatedAssignments: allAssignments,
                    Errors: errors
                });
            });


        return df.promise;
    }

    return service;
}