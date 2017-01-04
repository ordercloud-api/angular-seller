angular.module('orderCloud')
	.config(SecurityProfilesConfig)
	.controller('SecurityProfilesCtrl', SecurityProfilesController)
	.controller('SecurityProfileAssignmentsCtrl', SecurityProfileAssignmentsController)
    .controller('SecurityProfileCreateAssignmentCtrl', SecurityProfileCreateAssignmentController)
    .controller('SecurityProfileRolesCtrl', SecurityProfileRolesController)
    .factory('SecurityProfileFactory', SecurityProfileFactory)

	;

function SecurityProfilesConfig($stateProvider){
	$stateProvider
	.state('securityProfiles', {
        url: '/securityProfiles?search&searchOn&sortBy&page&pageSize',
		parent: 'base',
		templateUrl: 'securityProfiles/templates/securityProfiles.tpl.html',
		controller: 'SecurityProfilesCtrl',
		controllerAs: 'securityProfiles',
		data: {componentName: 'Security Profiles'},
		resolve: {
			Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
            SecurityProfilesList: function(OrderCloud, Parameters) {
                    return OrderCloud.SecurityProfiles.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy);
                }
		}
	})
    .state('securityProfiles.roles', {
        url: '/:securityprofileid/roles',
        templateUrl: 'securityProfiles/templates/securityProfileRoles.tpl.html',
        controller:'SecurityProfileRolesCtrl',
        controllerAs: 'securityProfileRoles',
        resolve: {
            SelectedSecurityProfile: function(OrderCloud, $stateParams){
                return OrderCloud.SecurityProfiles.Get($stateParams.securityprofileid);
            },
            NonAssignedRoles: function(SelectedSecurityProfile, SecurityProfileFactory){
                var allRoles = SecurityProfileFactory.AvailableRoles();
                return _.difference(allRoles, SelectedSecurityProfile.Roles);
            }
        }
    })
	.state('securityProfiles.assignments', {
        url: '/:securityprofileid/assignments?page&pageSize&userID&userGroupID&level',
        templateUrl: 'securityProfiles/templates/securityProfileAssignments.tpl.html',
        controller: 'SecurityProfileAssignmentsCtrl',
        controllerAs: 'securityProfileAssignments',
        resolve: {
            Parameters: function($stateParams, OrderCloudParameters){
                return OrderCloudParameters.Get($stateParams);
            },
            AssignmentList: function($stateParams, OrderCloud, Parameters){
                return OrderCloud.SecurityProfiles.ListAssignments($stateParams.securityprofileid, Parameters.userID, Parameters.userGroupID, Parameters.level, Parameters.page, Parameters.pageSize || 12, Parameters.buyerID)
            }
        }
    })
    .state('securityProfiles.createAssignment', {
        url: '/:securityprofileid/assignments/new',
        templateUrl: 'securityProfiles/templates/securityProfileCreateAssignment.tpl.html',
        controller: 'SecurityProfileCreateAssignmentCtrl',
        controllerAs: 'securityProfileCreateAssignment',
        resolve: {
            UserGroupList: function(OrderCloud){
                return OrderCloud.UserGroups.List();
            },
            UserList: function(OrderCloud){
                return OrderCloud.Users.List();
            }
        }
    })
}

function SecurityProfilesController($state, $stateParams, $ocMedia, OrderCloud, OrderCloudParameters, SecurityProfilesList, Parameters){
	var vm = this;
	vm.list = SecurityProfilesList;
	vm.parameters = Parameters;
	vm.securityProfileID = $stateParams.securityprofileid;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;


	//Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Use in mobile. Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.SecurityProfiles.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize ||  vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function SecurityProfileRolesController(SelectedSecurityProfile, NonAssignedRoles){
    var vm = this;
    vm.selectedProfile = SelectedSecurityProfile;
    vm.availableRoles = SelectedSecurityProfile.Roles;
    vm.unavailableRoles = NonAssignedRoles;
}

function SecurityProfileAssignmentsController($state, $stateParams, $exceptionHandler, toastr, OrderCloud, AssignmentList, Parameters){
	var vm = this;
	vm.list = AssignmentList;
	vm.parameters = Parameters;
    vm.SecurityProfileID = $stateParams.securityprofileid;
	vm.parameters = Parameters;

    vm.Delete = function(userID, userGroupID) {
        OrderCloud.SecurityProfiles.DeleteAssignment(vm.SecurityProfileID, userID, userGroupID)
            .then(function() {
                $state.reload();
                toastr.success('Security Profile Assignment Deleted', 'Success');
            })
            .catch(function(ex) {
                toastr.error(ex, 'Error');
                $exceptionHandler(ex)
            });
    };
    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };
    //Load the next page of results with all of the same parameters. Used on mobile
    vm.loadMore = function() {
        return OrderCloud.SecurityProfiles.ListAssignments($stateParams.securityprofileid, Parameters.userID, Parameters.userGroupID, Parameters.level, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.buyerID)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function SecurityProfileCreateAssignmentController($scope, $state, $q, $exceptionHandler, $stateParams, toastr, OrderCloud, SecurityProfileFactory, UserGroupList, UserList){
    var vm = this;
    vm.groupList = UserGroupList;
    vm.assignBuyer =false;
    vm.userList = UserList;
    vm.selectedUsers =[];
    vm.selectedGroups = [];
    vm.securityProfileID = $stateParams.securityprofileid;

    vm.assignmentModel = {
        SecurityProfileID: vm.securityProfileID,
        BuyerID: OrderCloud.BuyerID.Get(),
        UserID: null,
        UserGroupID: null
    };
    vm.toggleSelection = function(selection, party){
        //check if selection is in selected list, remove if it is, add if it isn't
        var partyName = 'selected' + party;
        var selectedPartyIds = _.pluck(vm[partyName], 'ID');

        var index = selectedPartyIds.indexOf(selection.ID);
        if(index > -1) {
            vm[partyName].splice(index, 1);
            selection.selected = false;
        }else{
            vm[partyName].push(selection);
            selection.selected = true;
        }
    };
    vm.Submit = function(){
        if(vm.assignBuyer){
            OrderCloud.SecurityProfiles.SaveAssignment(vm.assignmentModel)
                .then(function(){
                    $state.go('securityProfiles.assignments',{securityprofileid:vm.securityProfileID});
                    toastr.success('Security Profile Assignment Created', 'Success');
                })
                .catch(function(ex){
                    $exceptionHandler(ex)
                })
        }else{
            var dfd = $q.defer();
            var assignmentQueue = [];
            angular.forEach(vm.selectedUsers, function(user){
                var userModel = angular.copy(vm.assignmentModel);
                userModel.UserID = user.ID;
                assignmentQueue.push(OrderCloud.SecurityProfiles.SaveAssignment(userModel));
            });
            angular.forEach(vm.selectedGroups, function(userGroup){
                var groupModel = angular.copy(vm.assignmentModel);
                groupModel.UserGroupID = userGroup.ID;
                assignmentQueue.push(OrderCloud.SecurityProfiles.SaveAssignment(groupModel));
            });
            $q.all(assignmentQueue)
                .then(function(){
                    if((vm.selectedUsers.length + vm.selectedGroups.length) > 1){
                    toastr.success('Security Profile Assignments Created', 'Success');
                    $state.go('securityProfiles.assignments',{securityprofileid:vm.securityProfileID});                        
                    } else{
                        toastr.success('Security Profile Assignment Created', 'Success');
                        $state.go('securityProfiles.assignments',{securityprofileid:vm.securityProfileID});
                    }
                })
                .catch(function(ex){
                    $exceptionHandler(ex);
                })
        }
    };
    //watch user and user group list to remember selections upon new search
    $scope.$watchCollection(function(){
        return vm.userList;
    }, function(){
        SecurityProfileFactory.SetSelected(vm.userList.Items, vm.selectedUsers)
    });
    $scope.$watchCollection(function(){
        return vm.groupList;
    }, function(){
        SecurityProfileFactory.SetSelected(vm.groupList.Items, vm.selectedGroups)
    })
}

function SecurityProfileFactory(){
    var service = {
        AvailableRoles:_availableRoles,
        SetSelected: _setSelected
    };

    function _availableRoles() {
            return [
                "FullAccess",
                "ProductAdmin",
                "ProductReader",
                "InventoryAdmin",
                "ProductAssignmentAdmin",
                "BuyerAdmin",
                "BuyerReader",
                "CategoryAdmin",
                "CategoryReader",
                "AddressAdmin",
                "AddressReader",
                "CostCenterAdmin",
                "CostCenterReader",
                "PromotionAdmin",
                "PromotionReader",
                "CreditCardAdmin",
                "CreditCardReader",
                "PriceScheduleAdmin",
                "PriceScheduleReader",
                "SpendingAccountAdmin",
                "SpendingAccountReader",
                "BuyerUserAdmin",
                "BuyerUserReader",
                "UserGroupAdmin",
                "UserGroupReader",
                "ApprovalRuleAdmin",
                "ApprovalRuleReader",
                "PermissionAdmin",
                "OrderAdmin",
                "OrderReader",
                "UnsubmittedOrderReader",
                "MeAdmin",
                "MeXpAdmin",
                "MeAddressAdmin",
                "MeCreditCardAdmin",
                "OverrideUnitPrice",
                "OverrideShipping",
                "OverrideTax",
                "SetSecurityProfile"
            ]
        }

    function _setSelected(ListArray, AssignmentsArray){
        var selected = _.pluck(AssignmentsArray, 'ID');
        angular.forEach(ListArray, function(item){
            if(selected.indexOf(item.ID) > -1){
                item.selected = true;
            }
        })
    }
    return service;
}