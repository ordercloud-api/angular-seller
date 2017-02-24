angular.module('orderCloud')
	.controller('ChangePasswordModalCtrl', ChangePasswordModalController)
;

function ChangePasswordModalController($exceptionHandler, OrderCloud, $uibModalInstance, CurrentUser){
	var vm = this;
	vm.currentUser = CurrentUser;

	vm.submit = function() {
		var checkPasswordCredentials = {
			Username: vm.currentUser.Username,
			Password: vm.currentUser.CurrentPassword
		};

		return vm.loading = OrderCloud.Auth.GetToken(checkPasswordCredentials)
			.then(function() {
				return OrderCloud.Me.Patch({Password: vm.currentUser.NewPassword})
					.then(function(updatedUser) {
						$uibModalInstance.close(updatedUser);
					});
			})
			.catch(function(ex) {
				$exceptionHandler(ex);
			});
	};

	vm.cancel = function() {
		$uibModalInstance.dismiss();
	};
}