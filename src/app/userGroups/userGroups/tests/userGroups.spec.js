describe('Component: UserGroups', function() {
    var scope,
        q,
        userGroup,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        userGroup = {
            ID: "TestUserGroup123456789",
            Name: "TestUserGroupTest",
            Description: "Test",
            IsReportingGroup: false
        };
        oc = OrderCloud;
    }));

    describe('State: userGroups', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('userGroups');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
    });

    describe('State: userGroups.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('userGroups.edit');
            spyOn(oc.UserGroups, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedUserGroup', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedUserGroup);
            expect(oc.UserGroups.Get).toHaveBeenCalledWith($stateParams.usergroupid);
        }));
    });

    describe('State: userGroups.assign', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('userGroups.assign');
            spyOn(oc.Users, 'List').and.returnValue(null);
            spyOn(oc.UserGroups, 'ListUserAssignments').and.returnValue(null);
            spyOn(oc.UserGroups, 'Get').and.returnValue(null);
        }));
        it('should resolve UserList', inject(function($injector) {
            $injector.invoke(state.resolve.UserList);
            expect(oc.Users.List).toHaveBeenCalled();
        }));
        it('should resolve AssignedUsers', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUsers);
            expect(oc.UserGroups.ListUserAssignments).toHaveBeenCalledWith($stateParams.usergroupid);
        }));
        it('should resolve SelectedUserGroup', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedUserGroup);
            expect(oc.UserGroups.Get).toHaveBeenCalledWith($stateParams.usergroupid);
        }));
    });

    describe('Controller: UserGroupEditCtrl', function() {
        var userGroupEditCtrl;
        beforeEach(inject(function($state, $controller) {
            userGroupEditCtrl = $controller('UserGroupEditCtrl', {
                $scope: scope,
                SelectedUserGroup: userGroup
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                userGroupEditCtrl.userGroup = userGroup;
                userGroupEditCtrl.groupID = userGroup.ID;
                var defer = q.defer();
                defer.resolve(userGroup);
                spyOn(oc.UserGroups, 'Update').and.returnValue(defer.promise);
                userGroupEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the UserGroups Update method', function() {
                expect(oc.UserGroups.Update).toHaveBeenCalledWith(userGroupEditCtrl.groupID, userGroupEditCtrl.userGroup);
            });
            it ('should enter the userGroups state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('userGroups', {}, {reload: true});
            }));
        });
    });

    describe('Controller: UserGroupCreateCtrl', function() {
        var userGroupCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            userGroupCreateCtrl = $controller('UserGroupCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                userGroupCreateCtrl.userGroup = userGroup;
                var defer = q.defer();
                defer.resolve(userGroup);
                spyOn(oc.UserGroups, 'Create').and.returnValue(defer.promise);
                userGroupCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the UserGroups Create method', function() {
                expect(oc.UserGroups.Create).toHaveBeenCalledWith(userGroup);
            });
            it ('should enter the userGroups state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('userGroups', {}, {reload: true});
            }));
        });
    });

    describe('Controller: UserGroupAssignCtrl', function() {
        var userGroupAssignCtrl;
        beforeEach(inject(function($state, $controller) {
            userGroupAssignCtrl = $controller('UserGroupAssignCtrl', {
                $scope: scope,
                UserList: [],
                AssignedUsers: [],
                SelectedUserGroup: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function(Assignments) {
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                userGroupAssignCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                spyOn(Paging, 'Paging').and.returnValue(null);
                userGroupAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    });
});

