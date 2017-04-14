angular.module('orderCloud')
    .filter('ocDefaultPrice', OrderCloudDefaultPriceFilter)
;

function OrderCloudDefaultPriceFilter() {
    return function(priceObject, defaultPriceScheduleID, showDefault) {
        var result = {};
        angular.forEach(priceObject, function(val, key) {
            if (val.PriceSchedule.ID === defaultPriceScheduleID && showDefault) result[key] = val;
            if (val.PriceSchedule.ID !== defaultPriceScheduleID && !showDefault) result[key] = val;
        });

        return result;
    };
}