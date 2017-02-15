angular.module('orderCloud')
	.controller('ChangePasswordModalCtrl', ChangePasswordModalController)
;

function ChangePasswordModalController(toastr, $state, $exceptionHandler, AccountService, $uibModalInstance, CurrentUser){
	var vm = this;
	vm.currentUser = CurrentUser;

	vm.changePassword = function() {
		AccountService.ChangePassword(vm.currentUser)
			.then(function() {
				toastr.success('Password successfully changed', 'Success!');
				vm.currentUser.CurrentPassword = null;
				vm.currentUser.NewPassword = null;
				vm.currentUser.ConfirmPassword = null;
				vm.submit();
				$state.go('account.information');
			})
			.catch(function(ex) {
				$exceptionHandler(ex);
			});
	};

	vm.submit = function() {
		$uibModalInstance.close();
	};

	vm.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};
}