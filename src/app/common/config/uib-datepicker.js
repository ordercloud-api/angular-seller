angular.module('orderCloud')
    .config(function(uibDatepickerConfig, uibDatepickerPopupConfig) {
        //Default Datepicker Options
        uibDatepickerConfig.showWeeks = false;
        uibDatepickerPopupConfig.onOpenFocus = false;
        uibDatepickerPopupConfig.showButtonBar = false;
    })
;