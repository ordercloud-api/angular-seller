angular.module('orderCloud')
    .factory('ocCreditCards', OrderCloudCreditCards)
;

function OrderCloudCreditCards($q, $uibModal, ocConfirm, OrderCloud, ocAuthNet) {
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

    function _create(buyerID) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/creditCards/templates/creditCardCreate.modal.html',
            controller: 'CreditCardCreateModalCtrl',
            controllerAs: 'creditCardCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerID;
                }
            }
        }).result
    }

    function _edit(creditCard, buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/creditCards/templates/creditCardEdit.modal.html',
            controller: 'CreditCardEditModalCtrl',
            controllerAs: 'creditCardEditModal',
            bindToController: true,
            resolve: {
                SelectedCreditCard: function() {
                    return creditCard
                },
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _delete(creditCard, buyerid) {
        creditCard.Shared = true;
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + 'xxxx-xxxx-xxxx-' + creditCard.PartialAccountNumber + '</b>?',
                confirmText: 'Delete credit card',
                type: 'delete'})
            .then(function() {
                return ocAuthNet.DeleteCreditCard(creditCard, buyerid);
            });
    }

    function _getAssignments(level, buyerid, usergroupid) {
        return OrderCloud.CreditCards.ListAssignments(null, null, usergroupid, level, null, 100, buyerid)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    queue.push(OrderCloud.CreditCards.ListAssignments(null, null, usergroupid, level, currentPage, 100, buyerid));
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

    function _mapAssignments(allAssignments, creditCardList) {
        creditCardList.Items = _.map(creditCardList.Items, function(creditCard) {
            creditCard.Assigned = false;
            angular.forEach(allAssignments, function(assignment) {
                if (creditCard.ID == assignment.CreditCardID) creditCard.Assigned = true;
            });
            return creditCard;
        });

        return creditCardList;
    }

    function _compareAssignments(allAssignments, creditCardList, userGroupID) {
        var changedAssignments = [];
        angular.forEach(creditCardList.Items, function(creditCard) {
            var existingAssignment = _.where(allAssignments, {CreditCardID: creditCard.ID})[0];
            if (existingAssignment && !creditCard.Assigned) {
                changedAssignments.push({
                    "old": existingAssignment,
                    "new": null
                });
            } else if (!existingAssignment && creditCard.Assigned) {
                changedAssignments.push({
                    "old": null,
                    "new": {
                        UserGroupID: userGroupID,
                        CreditCardID: creditCard.ID
                    }
                });
            }
        });

        return changedAssignments;
    }

    function _updateAssignments(allAssignments, changedAssignments, buyerid) {
        var df = $q.defer(),
            assignmentQueue = [],
            errors = [];

        angular.forEach(changedAssignments, function(diff) {
            if (!diff.old && diff.new) {
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.CreditCards.SaveAssignment(diff.new, buyerid) // -- Create new User Assignment
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

                    OrderCloud.CreditCards.DeleteAssignment(diff.old.CreditCardID, null, diff.old.UserGroupID, buyerid)
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