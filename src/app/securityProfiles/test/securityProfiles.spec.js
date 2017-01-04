describe('Component: Security Profiles', function(){
	var scope,
		q,
		oc,
		OrderCloudParams,
		SPFactory
		;
		beforeEach(module(function($provide) {
        	$provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    	}));
    	beforeEach(module(function($provide) {
        	$provide.value('SelectedSecurityProfile', {Roles: ['FullAccess', 'ProductAdmin']})
    	}));
		beforeEach(module('orderCloud'));
		beforeEach(module('orderCloud.sdk'));
		beforeEach(inject(function($q, $rootScope, OrderCloud, OrderCloudParameters, SecurityProfileFactory, $ocMedia){
			q = $q;
			scope = $rootScope.$new();
			oc = OrderCloud;
			OrderCloudParams = OrderCloudParameters;
			SPFactory = SecurityProfileFactory;
		}));
		describe('State: securityProfiles', function(){
			var state;
			beforeEach(inject(function($state){
				state = $state.get('securityProfiles');
				spyOn(OrderCloudParams, 'Get').and.returnValue(null);
				spyOn(oc.SecurityProfiles, 'List').and.returnValue(null);
			}));
			it('should resolve Parameters', inject(function($injector, $stateParams){
				$injector.invoke(state.resolve.Parameters);
				expect(OrderCloudParams.Get).toHaveBeenCalledWith($stateParams);
			}));
			it('should resolve SecurityProfileList', inject(function($injector){
				$injector.invoke(state.resolve.SecurityProfilesList);
				expect(oc.SecurityProfiles.List).toHaveBeenCalled();
			}));
		});
		describe('State: securityProfiles.roles', function(){
			var state;
			beforeEach(inject(function($state){
				mockAvailableRoles = ["FullAccess","ProductAdmin","ProductReader","InventoryAdmin","ProductAssignmentAdmin","BuyerAdmin","BuyerReader","CategoryAdmin","CategoryReader","AddressAdmin","AddressReader","CostCenterAdmin","CostCenterReader","PromotionAdmin","PromotionReader","CreditCardAdmin","CreditCardReader","PriceScheduleAdmin","PriceScheduleReader","SpendingAccountAdmin","SpendingAccountReader","BuyerUserAdmin","BuyerUserReader","UserGroupAdmin","UserGroupReader","ApprovalRuleAdmin","ApprovalRuleReader","PermissionAdmin","OrderAdmin","OrderReader","UnsubmittedOrderReader","MeAdmin","MeXpAdmin","MeAddressAdmin","MeCreditCardAdmin","OverrideUnitPrice","OverrideShipping","OverrideTax","SetSecurityProfile"];
				state = $state.get('securityProfiles.roles');
				spyOn(oc.SecurityProfiles, 'Get').and.returnValue(['FullAccess', 'ProductAdmin']);
				spyOn(SPFactory, 'AvailableRoles').and.returnValue(mockAvailableRoles)
				spyOn(_, 'difference');
			}));
			it('should resolve SelectedSecurityProfile', inject(function($injector, $stateParams){
				$injector.invoke(state.resolve.SelectedSecurityProfile);
				expect(oc.SecurityProfiles.Get).toHaveBeenCalledWith($stateParams.securityprofileid);
			}));
			it('should resolve NonAssignedRoles', inject(function($injector){
				$injector.invoke(state.resolve.NonAssignedRoles);
				expect(SPFactory.AvailableRoles).toHaveBeenCalled();
				expect(_.difference).toHaveBeenCalledWith(mockAvailableRoles, ['FullAccess', 'ProductAdmin']);
			}));
		});
		describe('State: securityProfiles.assignments', function(){
			var state;
			beforeEach(inject(function($state){
				state = $state.get('securityProfiles.assignments');
				spyOn(OrderCloudParams, 'Get').and.returnValue(null);
				spyOn(oc.SecurityProfiles, 'ListAssignments').and.returnValue(null);
			}));
			it('should resolve Parameters', inject(function($injector, $stateParams){
				$injector.invoke(state.resolve.Parameters);
				expect(OrderCloudParams.Get).toHaveBeenCalledWith($stateParams);
			}));
			it('should resolve AssignmentList', inject(function($injector, $stateParams){
				$injector.invoke(state.resolve.AssignmentList);
				expect(oc.SecurityProfiles.ListAssignments).toHaveBeenCalledWith($stateParams.securityprofileid, null, null, null, null, 12, null);
			}));
		});
		describe('State: securityProfiles.createAssignment', function(){
			var state;
			beforeEach(inject(function($state){
				state = $state.get('securityProfiles.createAssignment');
				spyOn(oc.UserGroups, 'List').and.returnValue(null);
				spyOn(oc.Users, 'List').and.returnValue(null);
			}));
			it('should resolve UserGroupList', inject(function($injector){
				$injector.invoke(state.resolve.UserGroupList);
				expect(oc.UserGroups.List).toHaveBeenCalled();
			}));
			it('should resolve UserList', inject(function($injector){
				$injector.invoke(state.resolve.UserList);
				expect(oc.Users.List).toHaveBeenCalled();
			}));
		});
		describe('Controller: SecurityProfileAssignments', function(){
			var securityProfilesCtrl,
			assignmentList,
			state,
			toaster
			;
			beforeEach(inject(function($state, $controller, $ocMedia, $state, toastr){
				assignmentList = 'mockAssignments';
				state = $state;
				toaster = toastr;
				securityProfilesCtrl = $controller('SecurityProfileAssignmentsCtrl', {
					AssignmentList:assignmentList,
					$state: state,
					toastr: toaster
				})
			}));
			describe('Method: Delete', function(){
				beforeEach(function(){
					var dfd = q.defer();
					dfd.resolve();
					securityProfilesCtrl.SecurityProfileID = 'mockSecurityProfileID'
					spyOn(oc.SecurityProfiles, 'DeleteAssignment').and.returnValue(dfd.promise);
					spyOn(toaster, 'success');
					spyOn(state, 'reload');
					securityProfilesCtrl.Delete('mockUserID', 'mockUserGroupID');
					scope.$digest();
				})
				it('should call the SecurityProfiles DeleteAssignment method', function(){
					expect(oc.SecurityProfiles.DeleteAssignment).toHaveBeenCalledWith('mockSecurityProfileID', 'mockUserID', 'mockUserGroupID');
				})
				it('should reload the state', function(){
					expect(state.reload).toHaveBeenCalled();
				})
				it('should display success toastr', function(){
					expect(toaster.success).toHaveBeenCalledWith('Security Profile Assignment Deleted', 'Success')
				})
			})
		})
		describe('Controller: SecurityProfileCreateAssignmentController', function(){
			var securityProfileCreateAssignmentCtrl,
			mockSelectedUsers,
			mockSelectedGroups,
			mockUserGroupList,
			mockUserlist,
			mockAssignmentModel,
			state,
			toaster
			;
			beforeEach(inject(function($controller, $state, toastr){
				toaster = toastr
				state = $state;
				mockSelectedUsers = [{ID: 'mockuser1'}, {ID: 'mockuser2'}, {ID:'mockuser3'}];
				mockSelectedGroups = [{ID:'mockgroup1'}]
				mockUserGroupList ={ID:'mockUserGroupList'};
				mockUserList = {ID:'mockUserList'};
				BuyerAssignmentModel = {SecurityProfileID:'mockSecurityProfileID',BuyerID: '32',UserID: null,UserGroupID: null};
				securityProfileCreateAssignmentCtrl = $controller('SecurityProfileCreateAssignmentCtrl', {
					$scope:scope,
					UserGroupList:mockUserGroupList,
					UserList: mockUserList,
					$state:state,
					toastr:toaster
				});
			}))
			describe('Method: Submit', function(){
				beforeEach(function(){
					var defer = q.defer();
					defer.resolve();
					securityProfileCreateAssignmentCtrl.securityProfileID = 'mockSecurityProfileID';
					securityProfileCreateAssignmentCtrl.assignmentModel = {SecurityProfileID:'mockSecurityProfileID',BuyerID: '32',UserID: null,UserGroupID: null};
					spyOn(oc.SecurityProfiles, 'SaveAssignment').and.returnValue(defer.promise);
					spyOn(state, 'go');
					spyOn(toaster, 'success');
				})
				describe('assigning just a buyer', function(){
					beforeEach(function(){
						securityProfileCreateAssignmentCtrl.assignBuyer = 'buyer123';
						securityProfileCreateAssignmentCtrl.Submit();
						scope.$digest();
					})
					it('should call SecurityProfiles SaveAssignment method with just BuyerID', function(){
					expect(oc.SecurityProfiles.SaveAssignment).toHaveBeenCalledWith(BuyerAssignmentModel);
					})
					it('should take user to assignments page upon success', function(){
						expect(state.go).toHaveBeenCalledWith('securityProfiles.assignments',{securityprofileid:'mockSecurityProfileID'})
					})
					it('should display success toastr upon success', function(){
						expect(toaster.success).toHaveBeenCalledWith('Security Profile Assignment Created', 'Success')
					})
				})
				describe('assigning multiple users and userGroups', function(){
					beforeEach(function(){
						securityProfileCreateAssignmentCtrl.selectedUsers = mockSelectedUsers;
						securityProfileCreateAssignmentCtrl.selectedGroups = mockSelectedGroups;
						securityProfileCreateAssignmentCtrl.Submit();
						scope.$digest();
					})
					it('should save an assignment for each user and usergroup selected', function(){
						expect(oc.SecurityProfiles.SaveAssignment.calls.count()).toEqual(4);
					})
				})
			})
			describe('$watchCollection on userList and groupList', function(){
				beforeEach(function(){
					securityProfileCreateAssignmentCtrl.selectedUsers = mockSelectedUsers;
					securityProfileCreateAssignmentCtrl.selectedGroups = mockSelectedGroups;
					spyOn(SPFactory, 'SetSelected');
				})
				it('should call SecurityProfileFactory SetSelected method if userList changes', function(){
					scope.vm = securityProfileCreateAssignmentCtrl;
					securityProfileCreateAssignmentCtrl.userList = {Items:[{ID:'userListChanged'}]};
					scope.$digest();
					securityProfileCreateAssignmentCtrl.userList = {Items:[{ID:'userListChanged'}]};
					expect(SPFactory.SetSelected).toHaveBeenCalledWith([{ID:'userListChanged'}], mockSelectedUsers)
				})
				it('should call SecurityProfileFactory SetSelected method if groupList changes', function(){
					scope.vm = securityProfileCreateAssignmentCtrl;
					securityProfileCreateAssignmentCtrl.groupList = {Items:[{ID:'groupListChanged'}]};
					scope.$digest();
					securityProfileCreateAssignmentCtrl.groupList = {Items:[{ID:'groupListChanged'}]};
					expect(SPFactory.SetSelected).toHaveBeenCalledWith( [{ID:'groupListChanged'}], mockSelectedGroups)
				})
			})
		})
})