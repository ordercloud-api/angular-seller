describe('Component: AdminUsers', function() {
    var scope,
        q,
        adminUser,
        adminUserList,
        oc,
        ocAdminUsersSvc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null});
        $provide.value('CurrentAssignments', [
            {
                AdminUserGroupID: 'FAKE_ADMINUSERGROUP',
                AdminUserID: 'TestAdminUser123456789'
            }
        ]);
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud, ocAdminUsers) {
        q = $q;
        scope = $rootScope.$new();
        adminUser = {
            "Username": "TestAdminUser",
            "ID": "TestAdminUser123456789",
            "Email": "testadmin@four51.com",
            "Password": "Fails345",
            "FirstName": "Test",
            "LastName": "Test"
        };
        adminUserList = {
            Meta: {
                Page:1,
                PageSize:20,
                ItemRange: [0, 1],
                TotalCount:1,
                TotalPages:1
            },
            Items: [adminUser]
        };
        oc = OrderCloud;
        ocAdminUsersSvc = ocAdminUsers;
    }));

    describe('State: adminUsers', function() {
        var state;
        beforeEach(inject(function($state, ocParameters) {
            state = $state.get('adminUsers');
            var defer = q.defer();
            defer.resolve();
            spyOn(ocParameters, 'Get').and.returnValue(null);
            spyOn(oc.AdminUsers, 'List').and.returnValue(defer.promise);
        }));
        it('should resolve Parameters', inject(function($injector, ocParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(ocParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve AdminUserList', inject(function($injector) {
            $injector.invoke(state.resolve.AdminUsersList);
            expect(oc.AdminUsers.List).toHaveBeenCalled();
        }));
    });

    describe('State: adminUserGroup.users', function() {
        var state;
        beforeEach(inject(function($state, ocParameters) {
            state = $state.get('adminUserGroup.users');
            var defer = q.defer();
            defer.resolve();
            spyOn(ocParameters, 'Get').and.returnValue(null);
            spyOn(ocAdminUsersSvc.Assignments, 'Get').and.returnValue(defer.promise);
        }));
        describe('Resolve: Parameters', function() {
            it('should call ocParameters.Get()', inject(function($injector, ocParameters){
                $injector.invoke(state.resolve.Parameters);
                expect(ocParameters.Get).toHaveBeenCalled();
            }));
        });
        describe('Resolve: CurrentAssignments', function() {
            it('should call ocAdminUsers.Assignments.Get()', inject(function($injector) {
                $injector.invoke(state.resolve.CurrentAssignments);
                expect(ocAdminUsersSvc.Assignments.Get).toHaveBeenCalled();
            }));
        });
        describe('Resolve: UserList', function() {
            beforeEach(inject(function($injector) {
                var adminUserListAsync = q.defer();
                adminUserListAsync.resolve(adminUserList);
                spyOn(oc.AdminUsers, 'List').and.returnValue(adminUserListAsync.promise);
                spyOn(ocAdminUsersSvc.Assignments, 'Map').and.callThrough();
                $injector.invoke(state.resolve.UserList);
            }));
            it('should resolve AdminUserList', function() {
                expect(oc.AdminUsers.List).toHaveBeenCalled();
            });
            it ('should call ocAdminUsers.Assignments.Map()', inject(function(CurrentAssignments) {
                scope.$digest();
                expect(ocAdminUsersSvc.Assignments.Map).toHaveBeenCalledWith(CurrentAssignments, adminUserList);
            }));
        })
    });
    
    describe('Service: ocAdminUsers', function(){
        var uibModal, confirm;
        beforeEach(inject(function($uibModal, ocConfirm) {
            uibModal = $uibModal;
            confirm = ocConfirm;
        }));

        describe('Create', function() {
            it('should open adminUserCreateModal using $uibModal')
        });

        describe('Edit', function() {
            it('should open adminUserEditModal using $uibModal');
            it('should pass the SelectedUser to the $uibModal resolve')
        });

        describe('Delete', function() {
            it('should call ocConfirm.Confirm');
            it('should call OrderCloud.AdminUsers.Delete() if they confirm')
        });
        
        describe('Assignments', function() {
            describe('Get', function() {
                it ('should get the first 100 admin user groups');
                it ('should get the remaining pages if any');
            });
            describe('Map', function() {
                it ('should set user.Assigned to true if they are in the CurrentAssignments');
            });
            describe('Compare', function() {
                it ('should return a changed assignments array based on new or removed user.Assigned');
            });
            describe('Update', function() {
                it ('should add new user assignments to the assignmentQueue');
                it ('should add removed user assignments to the assignmentQueue');
                it ('should execute the assignmentQueue');
            })
        });
    });

    describe('Controller: AdminUsersCtrl', function() {
        var adminUsers, stateSvc, toastrSvc, ocAdminUsersSvc, ocParametersSvc;
        beforeEach(inject(function($controller, $state, toastr, ocAdminUsers, ocParameters, Parameters) {
            stateSvc = $state;
            toastrSvc = toastr;
            ocAdminUsersSvc = ocAdminUsers;
            ocParametersSvc = ocParameters;
            adminUsers = $controller('AdminUsersCtrl', {
                $state:stateSvc,
                toastr: toastrSvc,
                OrderCloud: oc,
                ocAdminUsers: ocAdminUsersSvc,
                ocParameters: ocParametersSvc,
                AdminUsersList: adminUserList,
                Parameters: Parameters
            })
        }));
        describe('Initialize', function() {
            it('should set vm.list to AdminUsersList');
            it('should set vm.parameters to Parameters');
            it('should set vm.sortSelection based on Parameters');
            it('should set vm.searchResults based on Parameters.search');
        });
        describe('Function: vm.filter', function() {
            it('should reload the state with ocParameters.Create()');
        });
        describe('Function: vm.search', function() {
            it('should reload the state with ocParameters.Create() and notify set to false');
            it('should call OrderCloud.AdminUsers.List()');
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
            it('should call OrderCloud.AdminUsers.List() with the new page');
            it('should add data.Items to the vm.list.Items array');
            it('should set vm.list.Meta to the response data.Meta');
        });
        describe('Function: vm.createUser', function() {
            it('should call ocAdminUsers.Create()');
            it('should push the new admin user to vm.list.Items');
            it('should increment vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
        describe('Function: vm.editUser', function() {
            it('should call ocAdminUsers.Edit()');
            it('should update the vm.list.Item[$index] with the updated admin user');
            it('should display a success toast');
        });
        describe('Function: vm.deleteUser', function() {
            it('should call ocAdminUsers.Delete()');
            it('should splice the deleted admin user from vm.list.Items');
            it('should decrement vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
    });

    describe('Controller: AdminUserGroupUsersCtrl', function() {
        var adminUserGroupUsers, mappedAdminUserList, exceptionHandler, filterSvc, stateParams, stateSvc, toastrSvc, ocAdminUsersSvc, ocRolesService, currentAssignments, ocParametersSvc;
        beforeEach(inject(function($controller, $exceptionHandler, $filter, $stateParams, $state, toastr, ocAdminUsers, ocParameters, CurrentAssignments, Parameters) {
            stateSvc = $state;
            stateParams = $stateParams;
            filterSvc = $filter;
            toastrSvc = toastr;
            ocAdminUsersSvc = ocAdminUsers;
            ocParametersSvc = ocParameters;
            currentAssignments = CurrentAssignments;
            exceptionHandler = $exceptionHandler;
            mappedAdminUserList = adminUserList;
            mappedAdminUserList.Items[0].Assigned = true;

            adminUserGroupUsers = $controller('AdminUserGroupUsersCtrl', {
                $exceptionHandler:exceptionHandler,
                $filter:filterSvc,
                $state:stateSvc,
                $stateParams:stateParams,
                toastr: toastrSvc,
                OrderCloud: oc,
                ocAdminUsers: ocAdminUsersSvc,
                ocParameters: ocParametersSvc,
                UserList: mappedAdminUserList,
                ocRolesService: ocRolesService,
                CurrentAssignments: currentAssignments,
                Parameters: Parameters
            })
        }));
        describe('Initialize', function() {
            it('should set vm.list to UserList');
            it('should set vm.parameters to Parameters');
            it('should set vm.sortSelection based on Parameters');
            it('should set vm.searchResults based on Parameters.search');
            it('should set vm.allItemsSelected based on vm.list.Items where {Assigned:true}');
        });
        describe('Function: vm.filter', function() {
            it('should reload the state with ocParameters.Create()');
        });
        describe('Function: vm.search', function() {
            it('should reload the state with ocParameters.Create() and notify set to false');
            it('should call OrderCloud.AdminUsers.List()');
            it('should set vm.list equal to the Mapped response');
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
            it('should call OrderCloud.AdminUsers.List() with the new page');
            it('should add data.Items to the vm.list.Items array');
            it('should set vm.list.Meta to the response data.Meta');
        });
        describe('Function: vm.selectAllItems', function() {
            it('should toggle vm.allItemsSelected');
            it('should map vm.list.Items with {Assigned:vm.allItemsSelected}');
        });
        describe('Function: vm.selectItem', function() {
            it('should set vm.allItemsSelected to false when !user.Assigned');
        });
        describe('Function: vm.resetAssignments', function() {
            it('should re-map the vm.list with CurrentAssignments');
            it('should set vm.changedAssignments to []');
        });
        describe('Function: vm.updateAssignments', function() {
            it('should call ocAdminUsers.Assignments.Update()');
            it('should send any errors to the $exceptionHandler');
            it('should set CurrentAssignments equal to data.UpdatedAssignments');
        });
        describe('Function: vm.createUser', function() {
            it('should call ocAdminUsers.Create()');
            it('should push the new admin user to vm.list.Items');
            it('should increment vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
        describe('Function: vm.editUser', function() {
            it('should call ocAdminUsers.Edit()');
            it('should update the vm.list.Item[$index] with the updated admin user');
            it('should display a success toast');
        });
        describe('Function: vm.deleteUser', function() {
            it('should call ocAdminUsers.Delete()');
            it('should splice the deleted admin user from vm.list.Items');
            it('should decrement vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
    });
    describe('Modal Controllers', function() {
        var uibModalInstance, exceptionHandler;
        beforeEach(inject(function($uibModalInstance, $exceptionHandler){
            uibModalInstance = $uibModalInstance;
            exceptionHandler = $exceptionHandler;
        }));
        describe('Controller: AdminUserEditModalCtrl', function() {
            var adminUserEditModalCtrl;
            beforeEach(inject(function($controller){
                adminUserEditModalCtrl = $controller('AdminUserEditModalCtrl', {
                    $uibModalInstance: uibModalInstance,
                    $exceptionHandler: exceptionHandler,
                    $scope: scope,
                    SelectedUser: adminUser,
                    OrderCloud: oc
                });
            }));
            describe('Initialize', function() {
                it ('should set vm.user to a copy of the SelectedUser');
                it ('should set vm.username equal to SelectedUser.Username');
                it ('should set vm.fullName equal to SelectedUser.FirstName + SelectedUser.LastName');
            });
            describe('Function: vm.submit()', function() {
                it ('should call OrderCloud.AdminUsers.Update()');
                it ('should close the modal with the updatedUser');
            });
            describe('Function: vm.cancel()', function() {
                it ('should dismiss the modal');
            })
        });
        describe('Controller: AdminUserCreateModalCtrl', function() {
            var adminUserCreateModalCtrl;
            beforeEach(inject(function($controller){
                adminUserCreateModalCtrl = $controller('AdminUserCreateModalCtrl', {
                    $uibModalInstance: uibModalInstance,
                    $exceptionHandler: exceptionHandler,
                    $scope: scope,
                    OrderCloud: oc
                });
            }));
            describe('Initialize', function() {
                it ('should set vm.user to a new object {Active:false}');
            });
            describe('Function: vm.submit()', function() {
                it ('should call OrderCloud.AdminUsers.Create()');
                it ('should close the modal with the newUser');
            });
            describe('Function: vm.cancel()', function() {
                it ('should dismiss the modal');
            })
        });
    });
});