angular.module('orderCloud')
	.config(function(toastrConfig) {
		angular.extend(toastrConfig, {
			containerId: 'toast-container',
			maxOpened: 5,
			newestOnTop: true,
			positionClass: 'toast-top-right',
			preventDuplicates: false,
			preventOpenDuplicates: true,
			progressBar:true,
			tapToClose:true,
			target: 'body',
			extendedTimeOut: 0,
			timeOut: 0,
			iconClasses: {
				error: 'alert-danger',
				info: 'alert-info',
				success: 'alert-success',
				warning: 'alert-warning'
			},
			toastClass: 'alert alert-dismissable',
			closeButton:true,
			closeHtml: '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
		});
	})
;