angular.module('orderCloud')
    .factory('ocPromotions', OrderCloudPromotions)
;

function OrderCloudPromotions($q, $uibModal, ocConfirm, OrderCloudSDK) {
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
        }).result;
    }

    function _edit(promotion, buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/promotions/templates/promotionEdit.modal.html',
            controller: 'PromotionEditModalCtrl',
            controllerAs: 'promotionEditModal',
            bindToController: true,
            resolve: {
                SelectedPromotion: function() {
                    return promotion;
                },
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result;
    }

    function _delete(promotion, buyerid) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + (promotion.Name ? promotion.Name : promotion.Code) + '</b>?',
                confirmText: 'Delete promotion',
                type: 'delete'})
            .then(function() {
                return OrderCloudSDK.Promotions.Delete(promotion.ID, buyerid);
            });
    }

    function _getAssignments(level, buyerid, usergroupid) {
        var options = {
            userGroupID:usergroupid,
            level:level,
            pageSize:100,
            buyerID:buyerid
        };
        return OrderCloudSDK.Promotions.ListAssignments(options)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    options.page = currentPage;
                    queue.push(OrderCloudSDK.Promotions.ListAssignments(options));
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
                    'old': existingAssignment,
                    'new': null
                });
            } else if (!existingAssignment && promotion.Assigned) {
                changedAssignments.push({
                    'old': null,
                    'new': {
                        BuyerID: buyerID,
                        UserGroupID: userGroupID,
                        PromotionID: promotion.ID
                    }
                });
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

                    OrderCloudSDK.Promotions.SaveAssignment(diff.new) // -- Create new User Assignment
                        .then(function() {
                            allAssignments.push(diff.new); //add the new assignment to the assignment list
                            d.resolve();
                        })
                        .catch(function(ex) {
                            errors.push(ex);
                            d.resolve();
                        });

                    return d.promise;
                })());
            } else if (diff.old && !diff.new) { // -- Delete existing User Assignment
                assignmentQueue.push((function() {
                    var d = $q.defer();
                    OrderCloudSDK.Promotions.DeleteAssignment(diff.old.PromotionID, diff.old.BuyerID, {userGroupID: diff.old.UserGroupID})
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