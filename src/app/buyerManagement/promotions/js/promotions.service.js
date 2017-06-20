angular.module('orderCloud')
    .factory('ocPromotions', OrderCloudPromotions)
;

function OrderCloudPromotions($q, $uibModal, $ocPromotions, ocConfirm, OrderCloudSDK) {
    var service = {
        Create: _create,
        Edit: _edit,
        Delete: _delete,
        Assignments: {
            Get: _getAssignments,
            Map: _mapAssignments,
            Compare: _compareAssignments,
            Update: _updateAssignments
        },
        MapTemplate: _mapTemplate,
        Typeahead: {
            Products: _typeAheadProducts,
            Categories: _typeAheadCategories
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
            var existingAssignment = _.filter(allAssignments, {PromotionID:promotion.ID, BuyerID:buyerID})[0];
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

    var promotionTemplates = $ocPromotions.GetPromotionTemplates();

    function replacePlaceholders(string, placeholder, replaceValue){
        placeholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp(placeholder, 'g');
        return string.replace(re, replaceValue);
    }

    function _mapTemplate(promotion) {
        var templateMatch = null;

        angular.forEach(promotionTemplates, function(template) {
            if (!templateMatch) {
                var eligibleParts = [];
                var split = template.EligibleExpression.split('{e');
                if (split[0]) eligibleParts.push(split[0]);
                angular.forEach(split, function(part, index) {
                    if (index > 0) {
                        part = 'e' + part;
                        var partSplit = part.split('}');
                        if (partSplit[1]) eligibleParts.push(partSplit[1]);
                    }
                });
                
                var valueParts = [];
                var split = template.ValueExpression.split('{');
                if (split[0]) valueParts.push(split[0]);
                angular.forEach(split, function(part, index) {
                    if (index > 0) {
                        var partSplit = part.split('}');
                        if (partSplit[1]) valueParts.push(partSplit[1]);
                    }
                });

                var valueEligibleParts = [];
                var split = template.ValueExpression.split('{e');
                if (split[0]) valueEligibleParts.push(split[0]);
                angular.forEach(split, function(part, index) {
                    if (index > 0) {
                        part = 'e' + part;
                        var partSplit = part.split('}');
                        if (partSplit[1]) valueEligibleParts.push(partSplit[1]);
                    }
                });

                var valueValueParts = [];
                var split = template.ValueExpression.split('{v');
                if (split[0]) valueValueParts.push(split[0]);
                angular.forEach(split, function(part, index) {
                    if (index > 0) {
                        part = 'v' + part;
                        var partSplit = part.split('}');
                        if (partSplit[1]) valueValueParts.push(partSplit[1]);
                    }
                });

                var match = true;
                angular.forEach(eligibleParts, function(part) {
                    if (promotion.EligibleExpression.indexOf(part) == -1) match = false;
                });
                angular.forEach(valueParts, function(part) {
                    if (promotion.ValueExpression.indexOf(part) == -1) match = false;
                });

                if (match) {
                    templateMatch = template;
                    templateMatch.EligibleParts = eligibleParts;
                    templateMatch.ValueParts = valueParts;
                    templateMatch.ValueEligibleParts = valueEligibleParts;
                    templateMatch.ValueValueParts = valueValueParts;
                }
            }
        });

        if (templateMatch) {
            var eligibleValues = [];
            var eligibleExpression = promotion.EligibleExpression;
            angular.forEach(templateMatch.EligibleParts, function(part, index) {
                var value = null;
                if (templateMatch.EligibleParts[index + 1]) {
                    value = eligibleExpression.split(part)[1].split(templateMatch.EligibleParts[index + 1])[0];
                }
                else {
                    value = eligibleExpression.split(part)[1];
                }
                if (value) eligibleValues.push(value);
            });

            var valueValues = [];
            var valueExpression = promotion.ValueExpression;

            angular.forEach(templateMatch.ValueValueParts, function(valuePart, index) {
                angular.forEach(eligibleValues, function(eligibleValue, i) {
                    templateMatch.ValueValueParts[index] = replacePlaceholders(valuePart, '{e' + i + '}', eligibleValue);
                });
            });

            angular.forEach(templateMatch.ValueValueParts, function(part, index) {
                var value = null;
                if (templateMatch.ValueValueParts[index + 1]) {
                    value = valueExpression.split(part)[1].split(templateMatch.ValueValueParts[index + 1])[0];
                }
                else {
                    value = valueExpression.split(part)[1];
                }
                if (value) valueValues.push(value);
            });

            angular.forEach(templateMatch.EligibleFields, function(field, index) {
                field.Value = field.Type == 'number' ? +(eligibleValues[index]) : eligibleValues[index];
            });

            angular.forEach(templateMatch.ValueFields, function(field, index) {
                field.Value = field.Type == 'number' ? +(valueValues[index]) : valueValues[index];
            });
        }

        return templateMatch;
    }

    function _typeAheadProducts(search) {
        var df = $q.defer();

        var options = {
            page: 1,
            pageSize: 20,
            search: search
        };
        OrderCloudSDK.Products.List(options)
            .then(function(data) {
                df.resolve(data.Items);
            });

        return df.promise;
    }

    function _typeAheadCategories(search, catalogID) {
        var options = {
            page: 1,
            pageSize: 20,
            search: search
        };
        return OrderCloudSDK.Categories.List(catalogID, options)
            .then(function(data) {
                return data.Items;
            });
    }

    return service;
}