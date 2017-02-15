angular.module('orderCloud')
	.controller('ConfirmPasswordModalCtrl', ConfirmPasswordModalController)
;

function ConfirmPasswordModalController($uibModalInstance) {
	var vm = this;

	vm.submit = function() {
		$uibModalInstance.close(vm.password);
	};

	vm.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};
}