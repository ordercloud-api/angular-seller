angular.module('orderCloud')
    .factory('ocUsers', OrderCloudUsers)
;

function OrderCloudUsers($q, $uibModal, ocConfirm, OrderCloud) {
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
            templateUrl: 'buyerManagement/users/templates/userCreate.modal.html',
            controller: 'UserCreateModalCtrl',
            controllerAs: 'userCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _edit(user, buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/users/templates/userEdit.modal.html',
            controller: 'UserEditModalCtrl',
            controllerAs: 'userEditModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                },
                SelectedUser: function() {
                    return user;
                }
            }
        }).result
    }

    function _delete(user, buyerid) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + user.Username + '</b>?',
                confirmText: 'Delete user',
                type: 'delete'})
            .then(function() {
                return OrderCloud.Users.Delete(user.ID, buyerid)
            })
    }

    function _getAssignments(buyerid, usergroupid) {
        return OrderCloud.UserGroups.ListUserAssignments(usergroupid, null, null, 100, buyerid)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    queue.push(OrderCloud.UserGroups.ListUserAssignments(usergroupid, null, currentPage, 100, buyerid));
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

    function _mapAssignments(allAssignments, userList) {
        userList.Items = _.map(userList.Items, function(user) {
            user.Assigned = false;
            angular.forEach(allAssignments, function(assignment) {
                if (user.ID == assignment.UserID) user.Assigned = true;
            });
            return user;
        });

        return userList;
    }

    function _compareAssignments(allAssignments, userList, userGroupID) {
        var changedAssignments = [];
        angular.forEach(userList.Items, function(user) {
            var existingAssignment = _.where(allAssignments, {UserID:user.ID})[0];
            if (existingAssignment && !user.Assigned) {
                changedAssignments.push({
                    "old": existingAssignment,
                    "new": null
                })
            } else if (!existingAssignment && user.Assigned) {
                changedAssignments.push({
                    "old": null,
                    "new": {
                        UserGroupID: userGroupID,
                        UserID: user.ID
                    }
                })
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

                    OrderCloud.UserGroups.SaveUserAssignment(diff.new, buyerid) // -- Create new User Assignment
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

                    OrderCloud.UserGroups.DeleteUserAssignment(diff.old.UserGroupID, diff.old.UserID, buyerid)
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