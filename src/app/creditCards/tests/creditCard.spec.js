describe('Component: CreditCards', function() {
    var scope,
        q,
        creditCard,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        creditCard = {
            ID: "TestCreditCard123456789",
            Token: "token",
            CardType: "Visa",
            PartialAccountNumber: "12345",
            CardholderName: "Test Test",
            ExpirationDate: "08/2018"
        };
        oc = OrderCloud;
    }));

    describe('State: creditCards', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('creditCards');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.CreditCards, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve CreditCardList', inject(function($injector) {
            $injector.invoke(state.resolve.CreditCardList);
            expect(oc.CreditCards.List).toHaveBeenCalled();
        }));
    });

    describe('State: creditCards.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('creditCards.edit');
            spyOn(oc.CreditCards, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedCreditCard', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCreditCard);
            expect(oc.CreditCards.Get).toHaveBeenCalledWith($stateParams.creditcardid);
        }));
    });

    describe('State: creditCards.assign', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('creditCards.assign');
            spyOn(oc.Buyers, 'Get').and.returnValue(null);
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.CreditCards, 'ListAssignments').and.returnValue(null);
            spyOn(oc.CreditCards, 'Get').and.returnValue(null);
        }));
        it('should resolve Buyer', inject(function($injector) {
            $injector.invoke(state.resolve.Buyer);
            expect(oc.Buyers.Get).toHaveBeenCalled();
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve AssignmentsList', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUserGroups);
            expect(oc.CreditCards.ListAssignments).toHaveBeenCalledWith($stateParams.creditcardid);
        }));
        it('should resolve SelectedCreditCard', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCreditCard);
            expect(oc.CreditCards.Get).toHaveBeenCalledWith($stateParams.creditcardid);
        }));
    });

    describe('Controller: CreditCardEditCtrl', function() {
        var creditCardEditCtrl;
        beforeEach(inject(function($state, $controller) {
            creditCardEditCtrl = $controller('CreditCardEditCtrl', {
                $scope: scope,
                SelectedCreditCard: creditCard
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                creditCardEditCtrl.creditCard = creditCard;
                creditCardEditCtrl.creditCardID = "TestCreditCard123456789";
                var defer = q.defer();
                defer.resolve(creditCard);
                spyOn(oc.CreditCards, 'Update').and.returnValue(defer.promise);
                creditCardEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the CreditCards Update method', function() {
                expect(oc.CreditCards.Update).toHaveBeenCalledWith(creditCardEditCtrl.creditCardID, creditCardEditCtrl.creditCard);
            });
            it ('should enter the creditCards state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('creditCards', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(creditCard);
                spyOn(oc.CreditCards, 'Delete').and.returnValue(defer.promise);
                creditCardEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the CreditCards Delete method', function() {
                expect(oc.CreditCards.Delete).toHaveBeenCalledWith(creditCard.ID);
            });
            it ('should enter the creditCards state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('creditCards', {}, {reload: true});
            }));
        });
    });

    describe('Controller: CreditCardCreateCtrl', function() {
        var creditCardCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            creditCardCreateCtrl = $controller('CreditCardCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                creditCardCreateCtrl.creditCard = creditCard;
                creditCardCreateCtrl.creditCard.ExpirationDate = new Date();
                var defer = q.defer();
                defer.resolve(creditCard);
                spyOn(oc.CreditCards, 'Create').and.returnValue(defer.promise);
                creditCardCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the CreditCards Create method', function() {
                expect(oc.CreditCards.Create).toHaveBeenCalledWith(creditCard);
            });
            it ('should enter the creditCards state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('creditCards', {}, {reload: true});
            }));
        });
    });

    describe('Controller: CreditCardAssignCtrl', function() {
        var creditCardAssignCtrl;
        beforeEach(inject(function($state, $controller) {
            creditCardAssignCtrl = $controller('CreditCardAssignCtrl', {
                $scope: scope,
                UserGroupList: [],
                AssignedUserGroups: [],
                SelectedCreditCard: {},
                Buyer: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function(Assignments) {
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                creditCardAssignCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                spyOn(Paging, 'Paging').and.returnValue(null);
                creditCardAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    });
});

