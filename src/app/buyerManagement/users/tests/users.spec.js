describe('Component: Users', function() {
    var scope,
        q,
        today,
        user,
        oc;
    beforeEach(module(function($provide) {
            $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
        }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        today = new Date();
        user = {
            "Username": "TestUser",
            "ID": "TestUser123456789",
            "Email": "testuser@four51.com",
            "Password": "Fails345",
            "FirstName": "Test",
            "LastName": "Test",
            "TermsAccepted": today,
        };
        oc = OrderCloud;
    }));

    describe('State: users', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('users');
            spyOn(oc.Users, 'List').and.returnValue(null);
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserList);
            expect(oc.Users.List).toHaveBeenCalled();
        }));
    });

    describe('State: users.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('users.edit');
            spyOn(oc.Users, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedUserGroup', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedUser);
            expect(oc.Users.Get).toHaveBeenCalledWith($stateParams.userid);
        }));
    });
    describe('Controller: UserCreateCtrl', function() {
        var userCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            userCreateCtrl = $controller('UserCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                userCreateCtrl.user = user;
                var defer = q.defer();
                defer.resolve(user);
                spyOn(oc.Users, 'Create').and.returnValue(defer.promise);
                userCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Users Create method', function() {
                expect(oc.Users.Create).toHaveBeenCalledWith(user);
            });
            it ('should enter the users state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('users', {}, {reload: true});
            }));
        });
    });

    describe('Controller: UserEditCtrl', function() {
        var userEditCtrl;
        beforeEach(inject(function($state, $controller) {
            userEditCtrl = $controller('UserEditCtrl', {
                $scope: scope,
                SelectedUser: user
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                userEditCtrl.user = user;
                userEditCtrl.userID = "TestUser123456789";
                var defer = q.defer();
                defer.resolve(user);
                spyOn(oc.Users, 'Update').and.returnValue(defer.promise);
                userEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Users Update method', function() {
                expect(oc.Users.Update).toHaveBeenCalledWith(userEditCtrl.userID, user);
            });
            it ('should enter the users state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('users', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(user);
                spyOn(oc.Users, 'Delete').and.returnValue(defer.promise);
                userEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Users Delete method', function() {
                expect(oc.Users.Delete).toHaveBeenCalledWith(user.ID);
            });
            it ('should enter the users state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('users', {}, {reload: true});
            }));
        });
    });
});