angular.module('orderCloud')
    .factory('ocAddresses', OrderCloudAddresses)
;

function OrderCloudAddresses($q, $uibModal, ocConfirm, OrderCloud) {
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
            templateUrl: 'buyerManagement/addresses/templates/addressCreate.modal.html',
            controller: 'AddressCreateModalCtrl',
            controllerAs: 'addressCreateModal',
            resolve: {
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _edit(address, buyerid) {
        return $uibModal.open({
            templateUrl: 'buyerManagement/addresses/templates/addressEdit.modal.html',
            controller: 'AddressEditModalCtrl',
            controllerAs: 'addressEditModal',
            bindToController: true,
            resolve: {
                SelectedAddress: function() {
                    return address
                },
                SelectedBuyerID: function() {
                    return buyerid;
                }
            }
        }).result
    }

    function _delete(address, buyerid) {
        return ocConfirm.Confirm({
            message:'Are you sure you want to delete <br> <b>' + (address.AddressName ? address.AddressName : address.ID) + '</b>?',
            confirmText: 'Delete address',
            type: 'delete'})
            .then(function() {
                return OrderCloud.Addresses.Delete(address.ID, buyerid)
            })
    }

    function _getAssignments(level, buyerid, usergroupid) {
        return OrderCloud.Addresses.ListAssignments(null, null, usergroupid, level, null, null, null, 100, buyerid)
            .then(function(data1) {
                var df = $q.defer(),
                    queue = [],
                    totalPages = angular.copy(data1.Meta.TotalPages),
                    currentPage = angular.copy(data1.Meta.Page);
                while(currentPage < totalPages) {
                    currentPage++;
                    queue.push(OrderCloud.Addresses.ListAssignments(null, null, usergroupid, level, null, null, currentPage, 100, buyerid));
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

    function _mapAssignments(allAssignments, addressList) {
        addressList.Items = _.map(addressList.Items, function(address) {
            angular.forEach(allAssignments, function(assignment) {
                if (address.ID == assignment.AddressID) {
                    address.shipping = assignment.IsShipping;
                    address.billing = assignment.IsBilling;
                }
            });
            return address;
        });

        return addressList;
    }

    function _compareAssignments(allAssignments, addressList, userGroupID) {
        var changedAssignments = [];
        angular.forEach(addressList.Items, function(address) {
            var existingAssignment = _.where(allAssignments, {AddressID:address.ID})[0];
            if (existingAssignment && (existingAssignment.IsShipping != address.shipping ||  existingAssignment.IsBilling != address.billing)) {
                changedAssignments.push({
                    "old": existingAssignment,
                    "new": {
                        UserGroupID: existingAssignment.UserGroupID,
                        AddressID: existingAssignment.AddressID,
                        IsShipping: address.shipping,
                        IsBilling: address.billing
                    }
                })
            } else if (!existingAssignment && (address.shipping || address.billing)) {
                changedAssignments.push({
                    "old": null,
                    "new": {
                        UserGroupID: userGroupID,
                        AddressID:address.ID,
                        IsShipping:address.shipping,
                        IsBilling:address.billing
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
            if (!diff.old) {
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Addresses.SaveAssignment(diff.new, buyerid) // -- Create new Address Assignment
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
            } else if (diff.new.IsBilling || diff.new.IsShipping) { // -- Update existing Address Assignment
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Addresses.SaveAssignment(diff.new, buyerid)
                        .then(function() {
                            allAssignments[allAssignments.indexOf(diff.old)] = diff.new; //replace the old assignment in the assignment list
                            d.resolve();
                        })
                        .catch(function(ex) {
                            errors.push(ex);
                            d.resolve();
                        });

                    return d.promise;
                })())
            } else { // -- Delete existing Address Assignment
                assignmentQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Addresses.DeleteAssignment(diff.new.AddressID, diff.new.UserID, diff.new.UserGroupID, buyerid)
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