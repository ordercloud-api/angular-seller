describe('Component: GiftCards', function() {
    var scope,
        q,
        giftCard,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        giftCard = {
            ID: "TestGiftCard123456789",
            Name: "TestGiftCard",
            AllowAsPaymentMethod: true,
            Balance: 50.0,
            RedemptionCode: "TestRedemptionCode12345",
            StartDate: null,
            EndDate: null,
            xp: null
        };
        oc = OrderCloud;
    }));

    describe('State: giftCards', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('giftCards');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.SpendingAccounts, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve GiftCardList', inject(function($injector) {
            $injector.invoke(state.resolve.GiftCardList);
            expect(oc.SpendingAccounts.List).toHaveBeenCalledWith(null, null, 12, null, null, {'RedemptionCode': '*'});
        }));
    });

    describe('State: giftCards.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('giftCards.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.SpendingAccounts, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedGiftCard', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedGiftCard);
            expect(oc.SpendingAccounts.Get).toHaveBeenCalledWith($stateParams.giftcardid);
        }));
    });

    describe('State: giftCards.assignGroup', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('giftCards.assignGroup');
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.SpendingAccounts, 'ListAssignments').and.returnValue(null);
            spyOn(oc.SpendingAccounts, 'Get').and.returnValue(null);
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUserGroups', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUserGroups);
            expect(oc.SpendingAccounts.ListAssignments).toHaveBeenCalledWith($stateParams.giftcardid, null, null, 'Group');
        }));
        it('should resolve SelectedGiftCard', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedGiftCard);
            expect(oc.SpendingAccounts.Get).toHaveBeenCalledWith($stateParams.giftcardid);
        }));
    });

    describe('State: giftCards.assignUser', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('giftCards.assignUser');
            spyOn(oc.Users, 'List').and.returnValue(null);
            spyOn(oc.SpendingAccounts, 'Get').and.returnValue(null);
            spyOn(oc.SpendingAccounts, 'ListAssignments').and.returnValue(null);
        }));
        it('should resolve UserList', inject(function($injector) {
            $injector.invoke(state.resolve.UserList);
            expect(oc.Users.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUsers', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUsers);
            expect(oc.SpendingAccounts.ListAssignments).toHaveBeenCalledWith($stateParams.giftcardid, null, null, 'User');
        }));
        it('should resolve SelectedGiftCard', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedGiftCard);
            expect(oc.SpendingAccounts.Get).toHaveBeenCalledWith($stateParams.giftcardid);
        }));
    });

    describe('Controller: GiftCardsCtrl', function() {
        var giftCardsCtrl;
        beforeEach(inject(function($state, $controller) {
            giftCardsCtrl = $controller('GiftCardsCtrl', {
                GiftCardList: []
            });
            spyOn($state, 'go').and.returnValue(true);
        }));
        describe('pagingfunction', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(null);
                spyOn(oc.SpendingAccounts, 'List').and.returnValue(defer.promise);
                scope.$digest();
                giftCardsCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                giftCardsCtrl.pagingfunction();
            });
            it ('should call the SpendingAccounts List method', function() {
                expect(oc.SpendingAccounts.List).toHaveBeenCalledWith(null, giftCardsCtrl.list.Meta.Page + 1, giftCardsCtrl.list.Meta.PageSize, null, null, {'RedemptionCode': '*'});
            });
        });
    });

    describe('Controller: GiftCardEditCtrl', function() {
        var giftCardEditCtrl;
        beforeEach(inject(function($state, $controller) {
            giftCardEditCtrl = $controller('GiftCardEditCtrl', {
                $scope: scope,
                SelectedGiftCard: giftCard
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                giftCardEditCtrl.giftCard = giftCard;
                giftCardEditCtrl.giftCardID = "TestGiftCard123456789";
                var defer = q.defer();
                defer.resolve(giftCard);
                spyOn(oc.SpendingAccounts, 'Update').and.returnValue(defer.promise);
                giftCardEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the SpendingAccounts Update method', function() {
                expect(oc.SpendingAccounts.Update).toHaveBeenCalledWith(giftCardEditCtrl.giftCardID, giftCardEditCtrl.giftCard);
            });
            it ('should enter the giftCards state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('giftCards', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(giftCard);
                spyOn(oc.SpendingAccounts, 'Delete').and.returnValue(defer.promise);
                giftCardEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the SpendingAccounts Delete method', function() {
                expect(oc.SpendingAccounts.Delete).toHaveBeenCalledWith(giftCard.ID);
            });
            it ('should enter the giftCards state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('giftCards', {}, {reload: true});
            }));
        });
    });

    describe('Controller: GiftCardCreateCtrl', function() {
        var giftCardCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            giftCardCreateCtrl = $controller('GiftCardCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                giftCardCreateCtrl.giftCard = giftCard;
                var defer = q.defer();
                defer.resolve(giftCard);
                spyOn(oc.SpendingAccounts, 'Create').and.returnValue(defer.promise);
                giftCardCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the SpendingAccounts Create method', function() {
                expect(oc.SpendingAccounts.Create).toHaveBeenCalledWith(giftCardCreateCtrl.giftCard);
            });
            it ('should enter the giftCards state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('giftCards', {}, {reload: true});
            }));
        });
    });

    describe('Controller: GiftCardAssignGroupCtrl', function() {
        var giftCardAssignGroupCtrl;
        beforeEach(inject(function($state, $controller) {
            giftCardAssignGroupCtrl = $controller('GiftCardAssignGroupCtrl', {
                $scope: scope,
                UserGroupList: [],
                AssignedUserGroups: [],
                SelectedGiftCard: {}

            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignments', function() {
            beforeEach(inject(function(Assignments) {
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                giftCardAssignGroupCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('pagingfunction', function() {
            beforeEach(function() {
                spyOn(oc.SpendingAccounts, 'ListAssignments').and.returnValue(null);
                giftCardAssignGroupCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                giftCardAssignGroupCtrl.assignments = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                giftCardAssignGroupCtrl.pagingfunction();
            });
            it ('should call the SpendingAccounts List method', function() {
                expect(oc.SpendingAccounts.ListAssignments).toHaveBeenCalledWith(giftCardAssignGroupCtrl.giftCard.ID, null, null, 'Group', giftCardAssignGroupCtrl.list.Meta.Page + 1, giftCardAssignGroupCtrl.list.Meta.PageSize);
            });
        });
    });

    describe('Controller: GiftCardAssignUserCtrl', function() {
        var giftCardAssignUserCtrl;
        beforeEach(inject(function($state, $controller) {
            giftCardAssignUserCtrl = $controller('GiftCardAssignUserCtrl', {
                $scope: scope,
                UserList: [],
                AssignedUsers: [],
                SelectedGiftCard: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignments', function() {
            beforeEach(inject(function(Assignments) {
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                giftCardAssignUserCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('pagingfunction', function() {
            beforeEach(function() {
                spyOn(oc.SpendingAccounts, 'ListAssignments').and.returnValue(null);
                giftCardAssignUserCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                giftCardAssignUserCtrl.assignments = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                giftCardAssignUserCtrl.pagingfunction();
            });
            it ('should call the SpendingAccounts List method', function() {
                expect(oc.SpendingAccounts.ListAssignments).toHaveBeenCalledWith(giftCardAssignUserCtrl.giftCard.ID, null, null, 'User', giftCardAssignUserCtrl.list.Meta.Page + 1, giftCardAssignUserCtrl.list.Meta.PageSize);
            });
        });
    });

    describe('Factory: GiftCardFactory', function() {
        var code;
        beforeEach(inject(function(GiftCardFactory) {
            code = GiftCardFactory.makeCode()
        }));
        it ('should return 16 digit code', inject(function() {
            expect(code.length).toEqual(16);
        }));
    });
});

