angular.module('orderCloud')
	.controller('AccountEditModalCtrl', AccountEditModalController)
;

function AccountEditModalController($uibModalInstance, $exceptionHandler, AccountService, CurrentUser, Profile){
	var vm = this;
	vm.profile = angular.copy(Profile);
	var currentProfile = CurrentUser;

	vm.update = function() {
		AccountService.Update(currentProfile, vm.profile)
			.then(function(data) {
				vm.profile = angular.copy(data);
				currentProfile = data;
				vm.submit();
			})
			.catch(function(ex) {
				vm.profile = currentProfile;
				$exceptionHandler(ex);
			});
	};

	vm.resetForm = function(form) {
		vm.profile = currentProfile;
		form.$setPristine(true);
	};

	vm.submit = function() {
		$uibModalInstance.close();
	};

	vm.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};
}