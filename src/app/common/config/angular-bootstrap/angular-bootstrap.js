angular.module('orderCloud')
    .config(function(uibDatepickerConfig, uibDatepickerPopupConfig, $uibModalProvider, $uibTooltipProvider) {
        //Default Datepicker Options
        uibDatepickerConfig.showWeeks = false;
        uibDatepickerPopupConfig.onOpenFocus = false;
        uibDatepickerPopupConfig.showButtonBar = false;

        //Default Modal Options
        $uibModalProvider.options.backdrop = 'static';

        //Default Tooltip Options
        $uibTooltipProvider.options({popupDelay: 800});
    })
;