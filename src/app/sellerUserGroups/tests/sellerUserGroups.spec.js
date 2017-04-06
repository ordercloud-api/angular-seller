describe('Component: AdminUserGroups', function(){
    var scope,
        q,
        oc,
        adminUserGroup,
        adminUserGroupList;
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
        adminUserGroupList = {
            Meta: {
                Page:1,
                PageSize:20,
                ItemRange: [0, 1],
                TotalCount:1,
                TotalPages:1
            },
            Items: [adminUserGroup]
        };
    }));
    describe('State: adminUserGroups', function() {
        var state;
        beforeEach(inject(function($state, ocParameters) {
            state = $state.get('adminUserGroups');
            spyOn(ocParameters, 'Get').and.returnValue(null);
            spyOn(oc.AdminUserGroups, 'List').and.returnValue(null);
        }));
        it('should resolve ocParameters', inject(function($injector, ocParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(ocParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve AdminUserGroupList', inject(function($injector){
            $injector.invoke(state.resolve.AdminUserGroupList);
            expect(oc.AdminUserGroups.List).toHaveBeenCalled();
        }));
    });
    describe('State: adminUserGroup', function() {
        var state;
        beforeEach(inject(function($state){
            state = $state.get('adminUserGroup');
            spyOn(oc.AdminUserGroups, 'Get').and.returnValue(null);
        }));
        it('should resolve SelectedAdminUserGroup', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.SelectedAdminUserGroup);
            expect(oc.AdminUserGroups.Get).toHaveBeenCalledWith($stateParams.adminusergroupid)
        }));
    });
    describe('Service: ocAdminUserGroups', function(){
        var uibModal, confirm;
        beforeEach(inject(function($uibModal, ocConfirm) {
            uibModal = $uibModal;
            confirm = ocConfirm;
        }));

        describe('Create', function() {
            it('should open adminUserGroupCreateModal using $uibModal')
        });

        describe('Delete', function() {
            it('should call ocConfirm.Confirm');
            it('should call OrderCloud.AdminUserGroups.Delete() if they confirm')
        })
    });
    describe('Controller: AdminUserGroupsCtrl', function() {
        var adminUserGroups, stateSvc, toastrSvc, ocAdminUserGroupsSvc, ocParametersSvc;
        beforeEach(inject(function($controller, $state, toastr, ocAdminUserGroups, ocParameters, Parameters) {
            stateSvc = $state;
            toastrSvc = toastr;
            ocAdminUserGroupsSvc = ocAdminUserGroups;
            ocParametersSvc = ocParameters;
            adminUserGroups = $controller('AdminUserGroupsCtrl', {
                $state:stateSvc,
                toastr: toastrSvc,
                OrderCloud: oc,
                ocAdminUserGroups: ocAdminUserGroupsSvc,
                ocParameters: ocParametersSvc,
                AdminUserGroupList: adminUserGroupList,
                Parameters: Parameters
            })
        }));
        describe('Initialize', function() {
            it('should set vm.list to AdminUserGroupList');
            it('should set vm.parameters to Parameters');
            it('should set vm.sortSelection based on Parameters');
            it('should set vm.searchResults based on Parameters.search');
        });
        describe('Function: vm.filter', function() {
            it('should reload the state with ocParameters.Create()');
        });
        describe('Function: vm.search', function() {
            it('should reload the state with ocParameters.Create() and notify set to false');
            it('should call OrderCloud.AdminUserGroups.List()');
            it('should set vm.list equal to the response');
            it('should set reset vm.searchResults based on vm.parameters.search');
        });
        describe('Function: vm.clearSearch', function() {
            it('should set vm.parameters.search to null');
            it('should call vm.filter(resetPage:true)');
        });
        describe('Function: vm.updateSort', function() {
            it('should set vm.parameters.sortBy to the value passed in');
            it('should call vm.filter(resetPage:false)');
        });
        describe('Function: vm.loadMore', function() {
            it('should call OrderCloud.AdminUserGroups.List() with the new page');
            it('should add data.Items to the vm.list.Items array');
            it('should set vm.list.Meta to the response data.Meta');
        });
        describe('Function: vm.createGroup', function() {
            it('should call ocAdminUserGroups.Create()');
            it('should push the new user group to vm.list.Items');
            it('should increment vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
        describe('Function: vm.deleteGroup', function() {
            it('should call ocAdminUserGroups.Delete()');
            it('should splice the deleted user group from vm.list.Items');
            it('should decrement vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
    });
    describe('Controller: AdminUserGroupCtrl', function() {
        var adminUserGroupCtrl, stateSvc, toastrSvc, ocAdminUserGroupsSvc;
        beforeEach(inject(function($controller, $state, toastr, ocAdminUserGroups) {
            stateSvc = $state;
            toastrSvc = toastr;
            ocAdminUserGroupsSvc = ocAdminUserGroups;
            adminUserGroupCtrl = $controller('AdminUserGroupCtrl', {
                $state:stateSvc,
                toastr: toastrSvc,
                OrderCloud: oc,
                ocAdminUserGroups: ocAdminUserGroupsSvc,
                SelectedAdminUserGroup: adminUserGroup
            });
            describe('Initialize', function() {
                it ('should set vm.group to SelectedAdminUserGroup');
                it ('should set vm.model to a copy of SelectedAdminUserGroup');
            });
            describe('Function: vm.update', function() {
                it ('should call OrderCloud.AdminUserGroups.Update()');
                it ('should call $state.go() with the new group ID and {notify:false}');
                it ('should set vm.group to the updated user group');
                it ('should set vm.model to a copy of the updated user group');
                it ('should set SelectedAdminUserGroup to a copy ofthe updated user group');
                it ('should display a success toast');
            });
            describe('Function: vm.delete', function() {
                it ('should call ocAdminUserGroups.Delete()');
                it ('should display a success toast');
                it ('should return to the adminUserGroups state');
            })
        }))
    });
    describe('Modal Controllers', function() {
        var uibModalInstance, exceptionHandler;
        beforeEach(inject(function($uibModalInstance, $exceptionHandler){
            uibModalInstance = $uibModalInstance;
            exceptionHandler = $exceptionHandler;
        }));
        describe('Controller: AdminGroupCreateModalCtrl', function() {
            var adminGroupCreateModalCtrl;
            beforeEach(inject(function($controller){
                adminGroupCreateModalCtrl = $controller('AdminGroupCreateModalCtrl', {
                    $uibModalInstance: uibModalInstance,
                    $exceptionHandler: exceptionHandler,
                    OrderCloud: oc
                });
            }));
            describe('Function: vm.submit()', function() {
                it ('should call OrderCloud.AdminGroups.Create()');
                it ('should close the modal with the newGroup');
            });
            describe('Function: vm.cancel()', function() {
                it ('should dismiss the modal');
            })
        });
    });
});