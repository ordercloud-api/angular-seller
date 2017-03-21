angular.module('orderCloud')
    .factory('UserUploadService', UserUploadService)
;

function UserUploadService($q, $timeout, OrderCloud, UploadService) {
    var service = {
        UploadUsers: _uploadUsers,
        ValidateUsers: _validateUsers,
        ValidateUserGroups: _validateUserGroups,
        ValidateAddress: _validateAddress
    };

    function _uploadUsers(buyer, users, userGroups, addresses) {
        var deferred = $q.defer();
        var successfulUsers = [];
        var successfulUserGroups = [];
        var successfulAddresses = [];

        var results = {
            FailedUsers: [],
            FailedUserGroups: [],
            FailedAddresses: [],
            FailedUserAssignments: [],
            FailedAddressAssignments: []
        };

        var userCount = users.length;
        var userGroupCount = userGroups.UserGroups.length;
        var addressCount = addresses.Address.length;
        var progress = [{Message: 'Uploading Users, User Groups, and Addresses', Total: userGroupCount + addressCount, SuccessCount: 0, ErrorCount: 0}];

        $timeout(function() {
            createUsers();
        }, 1000);

        function createUsers() {
            progress.push({Message: 'Upload Users', Total: userCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var userQueue = [];
            _.each(users.Users, function(user) {
                var userBody = {
                    ID: user.ID,
                    Username: user.Username,
                    FirstName: user.FirstName,
                    LastName: user.LastName,
                    Email: user.Email,
                    Phone: user.Phone,
                    Active: user.Active.toLowerCase() === 'true',
                    xp: {
                        Locations: user.xp.Locations
                    }
                };
                userQueue.push( (function() {
                    var d = $q.defer();

                    OrderCloud.Users.Update(userBody.ID, userBody, buyer.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            successfulUsers.push(userBody);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedUsers.push({UserID: userBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}})
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });
                    return d.promise;
                }) ());
            });

            $q.all(userQueue)
                .then(function() {
                    users = successfulUsers;
                    userCount = users.length;
                    createUserGroups();
                })
        }

        function createUserGroups() {
            progress.push({Message: 'Upload User Groups', Total: userGroupCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var userGroupQueue = [];
            _.each(userGroups.UserGroups, function(userGroup) {
                var userGroupBody = {
                    ID: userGroup.ID,
                    Name: userGroup.Name
                };

                userGroupQueue.push( (function() {
                    var d = $q.defer();

                    OrderCloud.UserGroups.Update(userGroupBody.ID, userGroupBody, buyer.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            if(ex.status === 404) {
                                OrderCloud.UserGroups.Create(userGroupBody, buyer.ID)
                                    .then(function() {
                                        progress[progress.length - 1].SuccessCount++;
                                        deferred.notify(progress);
                                        d.resolve();
                                    })
                                    .catch(function(ex){
                                        results.FailedUserGroups.push({UserGroupID: userGroupBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                        progress[progress.length - 1].ErrorCount++;
                                        deferred.notify(progress);
                                        d.resolve();
                                    })
                            } else {
                                results.FailedUserGroups.push({UserGroupID: userGroupBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                progress[progress.length - 1].ErrorCount++;
                                deferred.notify(progress);
                                d.resolve();
                            }
                        });
                    return d.promise;
                })());
            });

            $q.all(userGroupQueue)
                .then(function() {
                    successfulUserGroups = userGroups.UserGroups;
                    userGroupCount = userGroups.UserGroups.length;
                    saveUserAssignment(successfulUsers, userGroups);
                })
        }

        function saveUserAssignment(users, groups) {
            progress.push({Message: 'Assign Users to User Groups', Total: users.length, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var groupAssignmentQueue = [];
            _.each(users, function(user) {
                groupAssignmentQueue.push( (function() {
                    var d = $q.defer();
                    var assignedLocationIDs = user.xp.Locations;
                    _.each(assignedLocationIDs, function(id) {
                        var matchedID = _.findWhere(groups.UserGroups, {ID: id});
                        if(matchedID) {
                            var assignment = {
                                UserID: user.ID,
                                UserGroupID: matchedID.ID
                            };
                            OrderCloud.UserGroups.SaveUserAssignment(assignment, buyer.ID)
                                .then(function() {
                                    progress[progress.length - 1].SuccessCount++;
                                    deferred.notify(progress);
                                    d.resolve();
                                })
                                .catch(function(ex) {
                                    progress[progress.length - 1].ErrorCount++;
                                    deferred.notify(progress);
                                    results.FailedUserAssignments.push({UserID: assignment.UserID, UserGroupID: assignment.UserGroupID, Error: {Code: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                                    d.resolve();
                                });
                        } else {
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            results.FailedUserAssignments.push({UserID: user.ID, UserGroupID: matchedID.ID, Message: 'An error occurred while assigning this User to a matching User Group'});
                            d.resolve();
                        }
                    });
                    return d.promise;
                })());
            });
            $q.all(groupAssignmentQueue)
                .then(function() {
                    //successfulUserAssignments = userGroups.UserGroups;
                    //userGroupCount = userGroups.UserGroups.length;
                    createAddresses();
                });
        }

        function createAddresses() {
            progress.push({Message: 'Upload Addresses', Total: addressCount, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var addressQueue = [];
            _.each(addresses.Address, function(address) {
                var addressBody = {
                    ID: address.ID,
                    CompanyName: address.CompanyName,
                    Street1: address.Street1,
                    Street2: address.Street2,
                    City: address.City,
                    State: address.State,
                    Zip: address.Zip,
                    Country: address.Country,
                    Phone: address.Phone,
                    AddressName: address.AddressName
                };
                addressQueue.push( (function(){
                    var d = $q.defer();

                    OrderCloud.Addresses.Update(addressBody.ID, addressBody, buyer.ID)
                        .then(function() {
                            progress[progress.length -1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            results.FailedAddresses.push({AddressID: addressBody.ID, Error: {ErrorCode: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}})
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            d.resolve();
                        });
                    return d.promise;
                })());
            });

            $q.all(addressQueue)
                .then(function() {
                    successfulAddresses = addresses.Address;
                    addressCount = addresses.Address.length;
                    buildAddressAssignment(successfulUserGroups, successfulAddresses);
                })
        }

        function buildAddressAssignment(groups, addresses) {
            var addressAssignments = [];

            _.each(groups, function(group) {
                var matchingID = _.findWhere(addresses, {CompanyName: group.ID});
                if(matchingID) {
                    var assignment = {
                        IsShipping: true,
                        ISBilling: false,
                        AddressID: matchingID.ID,
                        UserGroupID: group.ID
                    };
                    addressAssignments.push(assignment);
                } else {
                    results.FailedAddressAssignments.push({UserGroupID: group.ID, Error: {Message: 'The Address for Group ' + group.ID + ' does not exist'}})
                }
            });
            saveAddressAssignment(addressAssignments);
        }

        function saveAddressAssignment(assignments) {
            progress.push({Message: 'Assign Addresses to User Groups', Total: assignments.length, SuccessCount: 0, ErrorCount: 0});
            deferred.notify(progress);
            var addressAssignmentQueue = [];
            _.each(assignments, function(assignment) {
                addressAssignmentQueue.push( (function() {
                    var d = $q.defer();
                    OrderCloud.Addresses.SaveAssignment(assignment, buyer.ID)
                        .then(function() {
                            progress[progress.length - 1].SuccessCount++;
                            deferred.notify(progress);
                            d.resolve();
                        })
                        .catch(function(ex) {
                            progress[progress.length - 1].ErrorCount++;
                            deferred.notify(progress);
                            results.FailedCategoryAssignments.push({AddressID: assignment.AddressID, UserGroupID: assignment.GroupID, Error: {Code: ex.data.Errors[0].ErrorCode, Message: ex.data.Errors[0].Message}});
                            d.resolve();
                        });
                    return d.promise;
                })());
            });
        }
        return deferred.promise;
    }

    function _validateUsers(users, mapping) {
        var result = {};
        result.Users = [];
        result.UserIssues = [];

        _.each(users, function(user) {
            validateSingleUser(user);
        });

        function validateSingleUser(user) {
            var userData = {
                ID: user[mapping.ID],
                Username: user[mapping.Username],
                FirstName: user[mapping.FirstName],
                LastName: user[mapping.LastName],
                Email: user[mapping.Email],
                Phone: user[mapping.Phone],
                Active: user[mapping.Active],
                xp: UploadService.BuildXpObj(user, mapping)
            };

            result.Users.push(userData);

            if (!userData.ID) {
                result.UserIssues.push({
                    ID: userData.ID,
                    Username: userData.Username,
                    Issue: 'User: ' + userData.Username + ' does not have an ID'
                });
            }
            if (!UploadService.IsValid(userData.ID)) {
                result.UserIssues.push({
                    ID: userData.ID,
                    Username: userData.Username,
                    Issue: 'User: ' + userData.Username + ' has special characters'
                });
            }
            if(!userData.Username) {
                result.UserIssues.push({
                    ID: userData.ID,
                    Username: userData.Username,
                    Issue: 'User ' + userData.ID + ' does not have a Username'
                });
            }
        }
        return result
    }

    function _validateUserGroups(groups, mapping) {
        var result = {};
        result.UserGroups = [];
        result.UserGroupIssues = [];

        _.each(groups, function(group) {
            validateSingleGroup(group)
        });

        function validateSingleGroup(group) {
            var userGroupData = {
                ID: group[mapping.ID],
                Name: group[mapping.Name]
            };

            result.UserGroups.push(userGroupData);

            if (!userGroupData.ID) {
                result.UserGroupIssues.push({
                    ID: userGroupData.ID,
                    Issue: 'User Group: ' + userGroupData.Name + ' does not have an ID'
                });
            }
            if (!UploadService.IsValid(userGroupData.ID)) {
                result.UserGroupIssues.push({
                    ID: userGroupData.ID,
                    Issue: 'User Group: ' + userGroupData.Name + ' has an invalid ID'
                });
            }
        }
        return result;
    }

    function _validateAddress(addresses, mapping) {
        var result = {};
        result.Address = [];
        result.AddressIssues = [];

        _.each(addresses, function(address) {
            validateSingleAddress(address);
        });

        function validateSingleAddress(address) {
            var addressData = {
                ID: address[mapping.ID],
                CompanyName: address[mapping.CompanyName],
                Street1: address[mapping.Street1],
                Street2: address[mapping.Street2],
                City: address[mapping.City],
                State: address[mapping.State],
                Zip: address[mapping.Zip],
                Country: address[mapping.Country],
                Phone: address[mapping.Phone],
                AddressName: address[mapping.AddressName]
            };

            result.Address.push(addressData);

            if (!UploadService.IsValid(addressData.ID)) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' has an invalid ID'
                });
            }
            if(!addressData.Street1) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' does not have a Street'
                })
            }
            if(!addressData.City) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' does not have a City'
                })
            }
            if(!addressData.State) {
                result.AddressIssues.push({
                    CompanyName: addressData.CompanyName,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.CompanyName + ' does not have a State'
                })
            }
            if(!addressData.Zip) {
                result.AddressIssues.push({
                    CompanyName: addressData.Zip,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.Zip + ' does not have a Zip Code'
                })
            }
            if(!addressData.Country) {
                result.AddressIssues.push({
                    CompanyName: addressData.Zip,
                    ID: addressData.ID,
                    Issues: 'Address: ' + addressData.Zip + ' does not have a Country'
                })
            }
        }
        return result;
    }

    return service;
}