angular.module('orderCloud')
    .factory('ocAdminUsers', OrderCloudAdminUsers)
;

function OrderCloudAdminUsers($q, $uibModal, ocConfirm, sdkOrderCloud) {
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

    function _create() {
        return $uibModal.open({
            templateUrl: 'adminUsers/templates/adminUserCreate.modal.html',
            controller: 'AdminUserCreateModalCtrl',
            controllerAs: 'adminUserCreateModal'
        }).result
    }

    function _edit(user) {
        return $uibModal.open({
            templateUrl: 'adminUsers/templates/adminUserEdit.modal.html',
            controller: 'AdminUserEditModalCtrl',
            controllerAs: 'adminUserEditModal',
            resolve: {
                SelectedUser: function() {
                    return user;
                }
            }
        }).result
    }

    function _delete(user) {
        return ocConfirm.Confirm({
                message:'Are you sure you want to delete <br> <b>' + user.Username + '</b>?',
                confirmText: 'Delete admin user',
                type: 'delete'})
            .then(function() {
                return sdkOrderCloud.AdminUsers.Delete(user.ID)
            })
    }

    function _getAssignments(usergroupid) {
        var options = {
            userGroupID:usergroupid,
            pageSize:100
        }
        return sdkOrderCloud.AdminUserGroups.ListUserAssignments(options)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    var options = {
                        userGroupID:usergroupid,
                        pageSize:100,
                        page: currentPage++
                    }
                    currentPage++;
                    queue.push(sdkOrderCloud.AdminUserGroups.ListUserAssignments(options));
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


    function _updateAssignments(allAssignments, changedAssignments) {
        var df = $q.defer(),
            assignmentQueue = [],
            errors = [];

        angular.forEach(changedAssignments, function(diff) {
            if (!diff.old && diff.new) {
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    sdkOrderCloud.AdminUserGroups.SaveUserAssignment(diff.new) // -- Create new User Assignment
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

                    sdkOrderCloud.AdminUserGroups.DeleteUserAssignment(diff.old.UserGroupID, diff.old.UserID)
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