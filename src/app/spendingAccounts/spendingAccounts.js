angular.module('orderCloud')
	.config(SpendingAccountsConfig)
	.controller('SpendingAccountsCtrl', SpendingAccountsController)
	.controller('SpendingAccountEditCtrl', SpendingAccountEditController)
	.controller('SpendingAccountCreateCtrl', SpendingAccountCreateController)
	.controller('SpendingAccountAssignGroupCtrl', SpendingAccountAssignGroupController)
	.controller('SpendingAccountAssignUserCtrl', SpendingAccountAssignUserController)
	.factory('SpendingAccountAssignment', SpendingAccountAssignment)
;

function SpendingAccountsConfig($stateProvider) {
	$stateProvider
		.state('spendingAccounts', {
			parent: 'base',
			templateUrl: 'spendingAccounts/templates/spendingAccounts.tpl.html',
			controller: 'SpendingAccountsCtrl',
			controllerAs: 'spendingAccounts',
			url: '/spendingaccounts?search&page&pageSize&searchOn&sortBy&filters',
			data: {componentName: 'Spending Accounts'},
			resolve: {
				Parameters: function($stateParams, OrderCloudParameters) {
					return OrderCloudParameters.Get($stateParams);
				},
				SpendingAccountList: function(OrderCloud, Parameters) {
					var parameters = angular.copy(Parameters);
					parameters.filters ? parameters.filters.RedemptionCode = '!*' : parameters.filters = {RedemptionCode: '!*'};
					return OrderCloud.SpendingAccounts.List(parameters.search, parameters.page, parameters.pageSize || 12, parameters.searchOn, parameters.sortBy, parameters.filters);
				}
			}
		})
		.state('spendingAccounts.edit', {
			url: '/:spendingaccountid/edit',
			templateUrl: 'spendingAccounts/templates/spendingAccountEdit.tpl.html',
			controller: 'SpendingAccountEditCtrl',
			controllerAs: 'spendingAccountEdit',
			resolve: {
				SelectedSpendingAccount: function($q, $stateParams, OrderCloud) {
					var d = $q.defer();
					OrderCloud.SpendingAccounts.Get($stateParams.spendingaccountid)
						.then(function(giftcard) {
							if (giftcard.StartDate != null)
								giftcard.StartDate = new Date(giftcard.StartDate);
							if (giftcard.EndDate != null)
								giftcard.EndDate = new Date(giftcard.EndDate);
							d.resolve(giftcard);
						});

					return d.promise;
				}
			}
		})
		.state('spendingAccounts.create', {
			url: '/create',
			templateUrl: 'spendingAccounts/templates/spendingAccountCreate.tpl.html',
			controller: 'SpendingAccountCreateCtrl',
			controllerAs: 'spendingAccountCreate'
		})
		.state('spendingAccounts.assignGroup', {
			url: '/:spendingaccountid/assign',
			templateUrl: 'spendingAccounts/templates/spendingAccountAssignGroup.tpl.html',
			controller: 'SpendingAccountAssignGroupCtrl',
			controllerAs: 'spendingAccountAssignGroup',
			resolve: {
				UserGroupList: function(OrderCloud) {
					return OrderCloud.UserGroups.List();
				},
				AssignedUserGroups: function($stateParams, OrderCloud) {
					return OrderCloud.SpendingAccounts.ListAssignments($stateParams.spendingaccountid, null, null, 'Group');
				},
				SelectedSpendingAccount: function($stateParams, OrderCloud) {
					return OrderCloud.SpendingAccounts.Get($stateParams.spendingaccountid);
				}
			}
		})
		.state('spendingAccounts.assignUser', {
			url: '/:spendingaccountid/assign/user',
			templateUrl: 'spendingAccounts/templates/spendingAccountAssignUser.tpl.html',
			controller: 'SpendingAccountAssignUserCtrl',
			controllerAs: 'spendingAccountAssignUser',
			resolve: {
				UserList: function(OrderCloud) {
					return OrderCloud.Users.List();
				},
				AssignedUsers: function($stateParams, OrderCloud) {
					return OrderCloud.SpendingAccounts.ListAssignments($stateParams.spendingaccountid, null, null, 'User');
				},
				SelectedSpendingAccount: function($stateParams, OrderCloud) {
					return OrderCloud.SpendingAccounts.Get($stateParams.spendingaccountid);
				}
			}
		})
	;
}

function SpendingAccountsController($state, $ocMedia, OrderCloud, OrderCloudParameters, SpendingAccountList, Parameters) {
	var vm = this;
	vm.list = SpendingAccountList;
	vm.parameters = Parameters;
	vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

	//Check if filters are applied
	vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
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
		$ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
		vm.filter(true);
	};

	//Conditionally set, reverse, remove the sortBy parameter & reload the state
	vm.updateSort = function(value) {
		value ? angular.noop() : value = vm.sortSelection;
		switch (vm.parameters.sortBy) {
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
		$state.go('.', {page: vm.list.Meta.Page});
	};

	//Load the next page of results with all of the same parameters
	vm.loadMore = function() {
		var parameters = angular.copy(Parameters);
		parameters.filters ? parameters.filters.RedemptionCode = '!*' : parameters.filters = {RedemptionCode: '!*'};
		return OrderCloud.SpendingAccounts.List(parameters.search, vm.list.Meta.Page + 1, parameters.pageSize || vm.list.Meta.PageSize, parameters.searchOn, parameters.sortBy, parameters.filters)
				.then(function(data) {
					vm.list.Items = vm.list.Items.concat(data.Items);
					vm.list.Meta = data.Meta;
				});
	};
}

function SpendingAccountEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedSpendingAccount) {
	var vm = this,
		spendingaccountid = SelectedSpendingAccount.ID;
	vm.spendingAccountName = SelectedSpendingAccount.Name;
	vm.spendingAccount = SelectedSpendingAccount;

	vm.Submit = function() {
		OrderCloud.SpendingAccounts.Update(spendingaccountid, vm.spendingAccount)
			.then(function() {
				$state.go('spendingAccounts', {}, {reload: true});
				toastr.success('Spending Account Updated', 'Success');
			})
			.catch(function(ex) {
				$exceptionHandler(ex)
			});
	};

	vm.Delete = function() {
		OrderCloud.SpendingAccounts.Delete(spendingaccountid)
			.then(function() {
				$state.go('spendingAccounts', {}, {reload: true});
				toastr.success('Spending Account Deleted', 'Success');
			})
			.catch(function(ex) {
				$exceptionHandler(ex)
			});
	};
}

function SpendingAccountCreateController($exceptionHandler, $state, toastr, OrderCloud) {
	var vm = this;
	vm.spendingAccount = {};

	vm.Submit = function() {
		OrderCloud.SpendingAccounts.Create(vm.spendingAccount)
			.then(function() {
				$state.go('spendingAccounts', {}, {reload: true});
				toastr.success('Spending Account Created', 'Success');
			})
			.catch(function(ex) {
				$exceptionHandler(ex)
			});
	};
}

function SpendingAccountAssignGroupController($scope, toastr, UserGroupList, AssignedUserGroups, SelectedSpendingAccount, SpendingAccountAssignment) {
	var vm = this;
	vm.list = UserGroupList;
	vm.assignments = AssignedUserGroups;
	vm.spendingAccount = SelectedSpendingAccount;
	vm.pagingfunction = PagingFunction;
	vm.saveAssignments = SaveAssignments;

	$scope.$watchCollection(function() {
		return vm.list;
	}, function() {
		SpendingAccountAssignment.SetSelected(vm.list.Items, vm.assignments.Items);
	});

	function SaveAssignments() {
		toastr.success('Assignment Updated', 'Success');
		return SpendingAccountAssignment.SaveAssignments(vm.spendingAccount.ID, vm.list.Items, vm.assignments.Items);
	}

	function PagingFunction() {
		return SpendingAccountAssignment.Paging(vm.spendingAccount.ID, vm.list, vm.assignments);
	}
}

function SpendingAccountAssignUserController($scope, toastr, Paging, UserList, AssignedUsers, SelectedSpendingAccount, SpendingAccountAssignment) {
	var vm = this;
	vm.list = UserList;
	vm.assignments = AssignedUsers;
	vm.spendingAccount = SelectedSpendingAccount;
	vm.pagingfunction = PagingFunction;
	vm.saveAssignments = SaveAssignments;

	$scope.$watchCollection(function() {
		return vm.list;
	}, function() {
		Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserID');
	});

	$scope.$watchCollection(function() {
		return vm.list;
	}, function() {
		SpendingAccountAssignment.SetSelected(vm.list.Items, vm.assignments.Items, 'User');
	});

	function SaveAssignments() {
		toastr.success('Assignment Updated', 'Success');
		return SpendingAccountAssignment.SaveAssignments(vm.spendingAccount.ID, vm.list.Items, vm.assignments.Items, 'User');
	}

	function PagingFunction() {
		return SpendingAccountAssignment.Paging(vm.spendingAccount.ID, vm.list, vm.assignments, 'User');
	}
}

function SpendingAccountAssignment($q, $state, $injector, OrderCloud, Assignments) {
	return {
		SaveAssignments: _saveAssignments,
		SetSelected: _setSelected,
		Paging: _paging
	};

	function _saveAssignments(SpendingAccountID, List, AssignmentList, Party) {
		var PartyID = (Party === 'User') ? 'UserID' : 'UserGroupID';
		var assigned = _.pluck(AssignmentList, PartyID);
		var selected = _.pluck(_.where(List, {selected: true}), 'ID');
		var toAdd = Assignments.GetToAssign(List, AssignmentList, PartyID);
		var toUpdate = _.intersection(selected, assigned);
		var toDelete = Assignments.GetToDelete(List, AssignmentList, PartyID);
		var queue = [];
		var dfd = $q.defer();
		angular.forEach(List, function(item) {
			if (toAdd.indexOf(item.ID) > -1) {
				saveAndUpdate(queue, SpendingAccountID, item, Party);
			}
			else if (toUpdate.indexOf(item.ID) > -1) {
				var AssignmentObject;
				if (Party === 'User') {
					AssignmentObject = _.where(AssignmentList, {UserID: item.ID})[0]; //should be only one
				}
				else {
					AssignmentObject = _.where(AssignmentList, {UserGroupID: item.ID})[0]; //should be only one
				}
				if (AssignmentObject.AllowExceed !== item.allowExceed) {
					saveAndUpdate(queue, SpendingAccountID, item, Party);
				}
			}
		});
		angular.forEach(toDelete, function(itemID) {
			if (Party === 'User') {
				queue.push(OrderCloud.SpendingAccounts.DeleteAssignment(SpendingAccountID, itemID, null));
			}
			else queue.push(OrderCloud.SpendingAccounts.DeleteAssignment(SpendingAccountID, null, itemID));
		});
		$q.all(queue).then(function() {
			dfd.resolve();
			$state.reload($state.current);
		});
		return dfd.promise;
	}

	function saveAndUpdate(queue, SpendingAccountID, item, Party) {
		var assignment = {
			SpendingAccountID: SpendingAccountID,
			UserID: null,
			UserGroupID: null,
			AllowExceed: item.allowExceed
		};
		if (Party === 'User') {
			assignment.UserID = item.ID;
		}
		else assignment.UserGroupID = item.ID;
		queue.push(OrderCloud.SpendingAccounts.SaveAssignment(assignment));
	}

	function _setSelected(List, AssignmentList, Party) {
		var PartyID = (Party === 'User') ? 'UserID' : 'UserGroupID';
		var assigned = Assignments.GetAssigned(AssignmentList, PartyID);
		var exceed = _.pluck(_.where(AssignmentList, {AllowExceed: true}), PartyID);
		angular.forEach(List, function(item) {
			if (assigned.indexOf(item.ID) > -1) {
				item.selected = true;
				if (exceed.indexOf(item.ID) > -1) {
					item.allowExceed = true;
				}
			}
		});
	}

	function _paging(SpendingAccountID, OrderCloud, ListObjects, AssignmentObjects, Party) {
		var ServiceName = (Party === 'User') ? 'Users' : 'UserGroups';
		var Level = (Party === 'User') ? 'User' : 'Group';
		var Service = $injector.get(ServiceName);
		if (ListObjects.Meta.Page < ListObjects.Meta.TotalPages) {
			var queue = [];
			var dfd = $q.defer();
			queue.push(Service.List(null, ListObjects.Meta.Page + 1, ListObjects.Meta.PageSize));
			if (AssignmentObjects.Meta.Page < AssignmentObjects.Meta.TotalPages) {
				queue.push(OrderCloud.SpendingAccounts.ListAssignments(SpendingAccountID, null, null, Level, AssignmentObjects.Meta.Page + 1, AssignmentObjects.Meta.PageSize));
			}
			$q.all(queue).then(function(results) {
				dfd.resolve();
				ListObjects.Meta = results[0].Meta;
				ListObjects.Items = [].concat(ListObjects.Items, results[0].Items);
				if (results[1]) {
					AssignmentObjects.Meta = results[1].Meta;
					AssignmentObjects.Items = [].concat(AssignmentObjects.Items, results[1].Items);
				}
				_setSelected(ListObjects.Items, AssignmentObjects.Items, Party);
			});
			return dfd.promise;
		}
		else return null;
	}
}
