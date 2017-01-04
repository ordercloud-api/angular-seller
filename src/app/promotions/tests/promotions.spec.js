describe('Component: Promotions', function() {
    var scope,
        q,
        promotion,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        promotion = {
            ID: "TestPromotion123456789",
            Name: "TestPromotion",
            Code: "TestPromotion",
            Description: "TestPromotion",
            FinePrint: "TestPromotion",
            UsagesRemaining: null,
            StartDate: null,
            ExpirationDate: null,
            EligibleExpression: "userGroup='test'",
            ValueExpression: 'order.Total/2',
            CanCombine: false,
            xp: {"OverrideEligibleExpression": true}
        };
        oc = OrderCloud;
    }));

    describe('State: promotions', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('promotions');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Promotions, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve PromotionList', inject(function($injector) {
            $injector.invoke(state.resolve.PromotionList);
            expect(oc.Promotions.List).toHaveBeenCalledWith(null, null, 12, null, null, undefined);
        }));
    });

    describe('State: promotions.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('promotions.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Promotions, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedPromotion', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedPromotion);
            expect(oc.Promotions.Get).toHaveBeenCalledWith($stateParams.promotionid);
        }));
    });

    describe('State: promotions.assignGroup', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('promotions.assignGroup');
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.Promotions, 'ListAssignments').and.returnValue(null);
            spyOn(oc.Promotions, 'Get').and.returnValue(null);
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUserGroups', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUserGroups);
            expect(oc.Promotions.ListAssignments).toHaveBeenCalledWith($stateParams.promotionid, null, null, 'Group');
        }));
        it('should resolve SelectedPromotion', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedPromotion);
            expect(oc.Promotions.Get).toHaveBeenCalledWith($stateParams.promotionid);
        }));
    });

    describe('State: promotions.assignUser', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('promotions.assignUser');
            spyOn(oc.Users, 'List').and.returnValue(null);
            spyOn(oc.Promotions, 'Get').and.returnValue(null);
            spyOn(oc.Promotions, 'ListAssignments').and.returnValue(null);
        }));
        it('should resolve UserList', inject(function($injector) {
            $injector.invoke(state.resolve.UserList);
            expect(oc.Users.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUsers', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUsers);
            expect(oc.Promotions.ListAssignments).toHaveBeenCalledWith($stateParams.promotionid, null, null, 'User');
        }));
        it('should resolve SelectedPromotion', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedPromotion);
            expect(oc.Promotions.Get).toHaveBeenCalledWith($stateParams.promotionid);
        }));
    });

    describe('Controller: PromotionEditCtrl', function() {
        var promotionEditCtrl;
        beforeEach(inject(function($state, $controller) {
            promotionEditCtrl = $controller('PromotionEditCtrl', {
                $scope: scope,
                SelectedPromotion: promotion
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                promotionEditCtrl.promotion = promotion;
                promotionEditCtrl.promotionID = "TestPromotion123456789";
                var defer = q.defer();
                defer.resolve(promotion);
                spyOn(oc.Promotions, 'Update').and.returnValue(defer.promise);
                promotionEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Promotions Update method', function() {
                expect(oc.Promotions.Update).toHaveBeenCalledWith(promotionEditCtrl.promotionID, promotionEditCtrl.promotion);
            });
            it ('should enter the promotions state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('promotions', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(promotion);
                spyOn(oc.Promotions, 'Delete').and.returnValue(defer.promise);
                promotionEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Promotions Delete method', function() {
                expect(oc.Promotions.Delete).toHaveBeenCalledWith(promotion.ID);
            });
            it ('should enter the promotions state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('promotions', {}, {reload: true});
            }));
        });
    });

    describe('Controller: PromotionCreateCtrl', function() {
        var promotionCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            promotionCreateCtrl = $controller('PromotionCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                promotionCreateCtrl.promotion = promotion;
                var defer = q.defer();
                defer.resolve(promotion);
                spyOn(oc.Promotions, 'Create').and.returnValue(defer.promise);
                promotionCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Promotions Create method', function() {
                expect(oc.Promotions.Create).toHaveBeenCalledWith(promotionCreateCtrl.promotion);
            });
            it ('should enter the promotions state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('promotions', {}, {reload: true});
            }));
        });
    });

    describe('Controller: PromotionAssignGroupCtrl', function() {
        var promotionAssignGroupCtrl;
        beforeEach(inject(function($state, $controller) {
            promotionAssignGroupCtrl = $controller('PromotionAssignGroupCtrl', {
                $scope: scope,
                UserGroupList: [],
                AssignedUserGroups: [],
                SelectedPromotion: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignments', function() {
            beforeEach(inject(function(PromotionAssignment) {
                spyOn(PromotionAssignment, 'SaveAssignments').and.returnValue(null);
                promotionAssignGroupCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(PromotionAssignment) {
                expect(PromotionAssignment.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('pagingfunction', function() {
            beforeEach(inject(function(PromotionAssignment) {
                spyOn(PromotionAssignment, 'Paging').and.returnValue(null);
                promotionAssignGroupCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                promotionAssignGroupCtrl.assignments = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                promotionAssignGroupCtrl.pagingfunction();
            }));
            it ('should call the PromotionAssignment paging method', inject(function(PromotionAssignment) {
                expect(PromotionAssignment.Paging).toHaveBeenCalledWith(promotionAssignGroupCtrl.promotion.ID, promotionAssignGroupCtrl.list, promotionAssignGroupCtrl.assignments);
            }));
        });
    });

    describe('Controller: PromotionAssignUserCtrl', function() {
        var promotionAssignUserCtrl;
        beforeEach(inject(function($state, $controller) {
            promotionAssignUserCtrl = $controller('PromotionAssignUserCtrl', {
                $scope: scope,
                UserList: [],
                AssignedUsers: [],
                SelectedPromotion: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignments', function() {
            beforeEach(inject(function(PromotionAssignment) {
                spyOn(PromotionAssignment, 'SaveAssignments').and.returnValue(null);
                promotionAssignUserCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(PromotionAssignment) {
                expect(PromotionAssignment.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('pagingfunction', function() {
            beforeEach(inject(function(PromotionAssignment) {
                spyOn(PromotionAssignment, 'Paging').and.returnValue(null);
                promotionAssignUserCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                promotionAssignUserCtrl.assignments = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                promotionAssignUserCtrl.pagingfunction();
            }));
            it ('should call the PromotionAssignment paging method', inject(function(PromotionAssignment) {
                expect(PromotionAssignment.Paging).toHaveBeenCalledWith(promotionAssignUserCtrl.promotion.ID, promotionAssignUserCtrl.list, promotionAssignUserCtrl.assignments, 'User');
            }));
        });
    });

    describe('Factory: PromotionAssignment', function() {
        var promotionAssignment, sampleList, assignments;
        beforeEach(inject(function(PromotionAssignment, Assignments, $state) {
            promotionAssignment = PromotionAssignment;
            sampleList = [{ID: 1, selected: true}, {ID: 2, selected: false}, {ID: 3}];
            assignments = Assignments;
            spyOn($state, 'reload').and.returnValue(true);
        }));
        it('getAssigned should return a list of IDs', function() {
            var result = assignments.GetAssigned(sampleList, 'ID');
            expect(result).toEqual([1, 2, 3]);
        });
        it('getSelected should return a list of IDs that also have selected set to true', function() {
            var result = assignments.GetSelected(sampleList, 'ID');
            expect(result).toEqual([1]);
        });
        it('getUnselected should return a list of IDs where selected is false or undefined', function() {
            var result = assignments.GetUnselected(sampleList, 'ID');
            expect(result).toEqual([2, 3]);
        });
        it('getToAssign should return a list of IDs that are different between the two lists', function() {
            var result = assignments.GetToAssign(sampleList, [], 'ID');
            expect(result).toEqual([1]);
        });
        it('getToDelete should return a list of IDs that are the same between the two lists', function() {
            var result = assignments.GetToDelete(sampleList, [{ID: 2}], 'ID');
            expect(result).toEqual([2]);
        });

        describe('saveAssignments', function() {
            var state,
                saveFunc,
                deleteFunc,
                saveCount, deleteCount;
            beforeEach(inject(function($state) {
                state = $state;
                saveCount = deleteCount = 0;
                saveFunc = function() {
                    saveCount++;
                };
                deleteFunc = function() {
                    deleteCount++;
                };
                assignments.SaveAssignments(
                    [{ID: 1, selected: true}, {ID: 2, selected: true}, {ID: 3, selected: false}, {ID: 4, selected: false}],
                    [{ID: 3}, {ID: 4}],
                    saveFunc, deleteFunc, 'ID');
                scope.$digest();
            }));
            it('should call the saveFunc twice', function() {
                expect(saveCount).toBe(2);
            });
            it('should call the deleteFunc twice', function() {
                expect(deleteCount).toBe(2);
            });
            it('should call the state reload function on the current state', function() {
                expect(state.reload).toHaveBeenCalledWith(state.current);
            });
        });
    });

});

