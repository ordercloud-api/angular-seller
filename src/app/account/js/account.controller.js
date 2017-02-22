angular.module('orderCloud')
	.controller('AccountCtrl', AccountController)
;

function AccountController($uibModal, CurrentUser){
	var vm = this;
	vm.profile = angular.copy(CurrentUser);
	vm.currentUser = CurrentUser;

	vm.editInfo = function(){
		$uibModal.open({
			animation: true,
			templateUrl: 'account/templates/accountEdit.modal.html',
			controller: 'AccountEditModalCtrl',
			controllerAs: 'accountEditModal',
			backdrop:'static',
			size: 'md',
			resolve: {
				Profile: function(){
					return vm.profile;
				},
				CurrentUser: function(){
					return vm.currentUser;
				}
			}
		}).result.then(function(updatedUser) {
			vm.profile = angular.copy(updatedUser);
			vm.currentUser = updatedUser;
		});
	};

	vm.changePassword = function(user){
		$uibModal.open({
			animation: true,
			templateUrl: 'account/templates/changePassword.modal.html',
			controller: 'ChangePasswordModalCtrl',
			controllerAs: 'changePasswordModal',
			backdrop:'static',
			size: 'md',
			resolve: {
				CurrentUser: function(){
					return user;
				}
			}
		});
	};
}