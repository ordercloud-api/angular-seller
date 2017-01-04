describe('Component: AdminUserGroups', function(){
    var scope,
        q,
        oc,
        adminUserGroup;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
        adminUserGroup = {
            ID: "TestAdminUserGroup123456789",
            Name: "TestAdminUserGroupTest",
            Description: "Test"
        };
    }));
    describe('State: adminUserGroups', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('adminUserGroups');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.AdminUserGroups, 'List').and.returnValue(null);
        }));
        it('should resolve OrderCloudParameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve AdminUserGroupList', inject(function($injector){
            $injector.invoke(state.resolve.AdminUserGroupList);
            expect(oc.AdminUserGroups.List).toHaveBeenCalled();
        }));
    });
    describe('State: adminUserGroups.edit', function() {
        var state;
        beforeEach(inject(function($state){
            state = $state.get('adminUserGroups.edit');
            spyOn(oc.AdminUserGroups, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedAdminUserGroup', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.SelectedAdminUserGroup);
            expect(oc.AdminUserGroups.Get).toHaveBeenCalledWith($stateParams.adminusergroupid)
        }));
    });
    describe('State: adminUserGroups.assign', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('adminUserGroups.assign');
            spyOn(oc.AdminUsers, 'List').and.returnValue(null);
            spyOn(oc.AdminUserGroups, 'ListUserAssignments').and.returnValue(null);
            spyOn(oc.AdminUserGroups, 'Get').and.returnValue(null);
        }));
        it('should resolve AdminUsersList', inject(function($injector){
            $injector.invoke(state.resolve.AdminUserList);
            expect(oc.AdminUsers.List).toHaveBeenCalledWith(null, 1, 20);
        }));
        it('should resolve AssignedAdminUsers', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.AssignedAdminUsers);
            expect(oc.AdminUserGroups.ListUserAssignments).toHaveBeenCalledWith($stateParams.adminusergroupid);
        }));
        it('should resolve SelectedAdminUserGroup', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.SelectedAdminUserGroup);
            expect(oc.AdminUserGroups.Get).toHaveBeenCalledWith($stateParams.adminusergroupid);
        }));
    });
    describe('Controller: AdminUserGroupEditCtrl', function() {
        var adminUserGroupEditCtrl;
        beforeEach(inject(function($state, $controller){
            adminUserGroupEditCtrl = $controller('AdminUserGroupEditCtrl', {
                $scope: scope,
                SelectedAdminUserGroup: adminUserGroup
            });
        }));
        describe('Submit', function(){
            beforeEach(inject(function($state) {
                adminUserGroupEditCtrl.adminUserGroup = adminUserGroup;
                adminUserGroupEditCtrl.adminGroupID = adminUserGroup.ID;
                var defer = q.defer();
                defer.resolve(adminUserGroup);
                spyOn(oc.AdminUserGroups, 'Update').and.returnValue(defer.promise);
                spyOn($state, 'go').and.returnValue(true);
                adminUserGroupEditCtrl.Submit();
                scope.$digest();
            }));
            it('should call the AdminUserGroups Update method', function(){
                expect(oc.AdminUserGroups.Update).toHaveBeenCalledWith(adminUserGroupEditCtrl.adminGroupID, adminUserGroupEditCtrl.adminUserGroup);
            });
            it('should enter the adminUserGroups state', inject(function($state){
                expect($state.go).toHaveBeenCalledWith('adminUserGroups', {}, {reload: true});
            }))
        });
        describe('Delete', function(){
            beforeEach(inject(function($state) {
                var defer = q.defer();
                defer.resolve(adminUserGroup);
                spyOn(oc.AdminUserGroups, 'Delete').and.returnValue(defer.promise);
                spyOn($state, 'go').and.returnValue(true);
                adminUserGroupEditCtrl.Delete();
                scope.$digest();
            }));
            it('should call the AdminUserGroups Delete method', function(){
                expect(oc.AdminUserGroups.Delete).toHaveBeenCalledWith(adminUserGroup.ID);
            });
            it('should enter the adminUserGroups state', inject(function($state){
                expect($state.go).toHaveBeenCalledWith('adminUserGroups', {}, {reload: true});
            }))
        })
    });
    describe('Controller: AdminUserGroupCreateCtrl' ,function(){
        var adminUserGroupCreateCtrl;
        beforeEach(inject(function($state, $controller){
            adminUserGroupCreateCtrl = $controller('AdminUserGroupCreateCtrl', {
                $scope: scope,
                SelectedAdminUserGroup: adminUserGroup
            });
        }));
        describe('Submit', function(){
            beforeEach(inject(function($state){
                adminUserGroupCreateCtrl.adminUserGroup = adminUserGroup;
                var defer = q.defer();
                defer.resolve();
                spyOn(oc.AdminUserGroups, 'Create').and.returnValue(defer.promise);
                spyOn($state, 'go').and.returnValue(true);
                adminUserGroupCreateCtrl.Submit();
                scope.$digest();
            }));
            it('should call the AdminUserGroups Submit method', function(){
                expect(oc.AdminUserGroups.Create).toHaveBeenCalledWith(adminUserGroupCreateCtrl.adminUserGroup)
            });
            it('should enter the adminUserGroups state', inject(function($state){
                expect($state.go).toHaveBeenCalledWith('adminUserGroups', {}, {reload: true});
            }))
        })
    });
    describe('Controller: AdminUserGroupAssignCtrl', function(){
        var adminUserGroupAssignCtrl;
        beforeEach(inject(function($state, $controller){
            adminUserGroupAssignCtrl = $controller('AdminUserGroupAssignCtrl', {
                $scope: scope,
                AdminUserList: [],
                AssignedAdminUsers: [],
                SelectedAdminUserGroup: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));
        describe('SaveAssignment', function(){
            beforeEach(inject(function(Assignments){
                spyOn(Assignments, 'SaveAssignments').and.returnValue(null);
                adminUserGroupAssignCtrl.saveAssignments();
            }));
            it('should call the Assignments saveAssignments method', inject(function(Assignments){
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }))
        });
        describe('PagingFunction', function(){
            beforeEach(inject(function(Paging){
                spyOn(Paging, 'Paging').and.returnValue(null);
                adminUserGroupAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging){
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    })
});