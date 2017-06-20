angular.module('orderCloud')
    .directive('ocPriceBreaks', OrderCloudPriceBreaksDirective);

function OrderCloudPriceBreaksDirective($filter, ocProductPricing, OrderCloudSDK, toastr) {
    var directive = {
        scope: {
            priceschedule: '='
        },
        templateUrl: 'productManagement/pricing/templates/ocPriceBreaks.directive.html',
        link: linkFn
    };

    function linkFn(scope, element, attrs) {
        //set up custom validators
        scope.newBreakForm.Quantity.$validators.priceBreakQuantityConflict = PriceBreakQuantityValidator;
        scope.newBreakForm.Quantity.$validators.priceBreakStartingQuantity = PriceBreakStartingQuantityValidator;
        scope.newBreakForm.Quantity.$validators.priceBreakOtherQuantity = PriceBreakOtherQuantitesValidator;

        //initialize the form
        function _initializeForm(shouldFocus) {
            scope.newBreak = {
                Quantity: null,
                Price: null
            };
            scope.newBreakForm.Quantity.$setPristine();
            scope.newBreakForm.Quantity.$setUntouched();
            scope.newBreakForm.Price.$setPristine();
            scope.newBreakForm.Price.$setUntouched();
            if (shouldFocus) scope.newBreakForm.Quantity.$$element[0].focus();

        }(false);

        //view functions
        scope.onEnterKeypress = onEnterKeypress;
        scope.addPriceBreak = addPriceBreak;
        scope.deletePriceBreak = deletePriceBreak;

        scope.$watch('priceschedule.RestrictedQuantity', function (n) {
            if (n && scope.priceschedule.PriceBreaks.length) syncMinMaxValues();
        });

        function PriceBreakQuantityValidator(modelValue, viewValue) {
            var value = modelValue || viewValue;
            return !_.find(scope.priceschedule.PriceBreaks, {
                Quantity: value
            });
        }

        function PriceBreakStartingQuantityValidator(modelValue, viewValue) {
            var value = modelValue || viewValue;
            if (!value) return true;
            if (scope.priceschedule.PriceBreaks.length > 0 || scope.priceschedule.RestrictedQuantity) return true;
            if (scope.priceschedule.PriceBreaks.length > 0) return value >= scope.priceschedule.MinQuantity;
            return value === scope.priceschedule.MinQuantity;
        }

        function PriceBreakOtherQuantitesValidator(modelValue, viewValue) {
            var value = modelValue || viewValue;
            if (!value) return true;
            if (scope.priceschedule.PriceBreaks.length === 0 || scope.priceschedule.RestrictedQuantity) return true;
            return value >= scope.priceschedule.MinQuantity;
        }

        function onEnterKeypress($event) {
            if ($event.keyCode !== 13) return;
            $event.preventDefault();
            if (!scope.newBreakForm.$invalid) addPriceBreak();
        }

        function addPriceBreak() {
            scope.priceschedule.PriceBreaks.push(scope.newBreak);
            ocProductPricing.PriceBreaks.FormatQuantities(scope.priceschedule.PriceBreaks);
            if (scope.priceschedule.RestrictedQuantity) syncMinMaxValues();
            _initializeForm(true);
        }

        function deletePriceBreak(index) {
            if (index === 0) {
                scope.priceschedule.PriceBreaks.splice(index, 1);
                if (scope.priceschedule.PriceBreaks.length) {
                    syncMinMaxValues('min');
                } else {
                    scope.priceschedule.MinQuantity = 1;
                }
            } else if (index === scope.priceschedule.PriceBreaks.length - 1 && (scope.priceschedule.RestrictedQuantity || scope.priceschedule.MaxQuantity)) {
                scope.priceschedule.PriceBreaks.splice(index, 1);
                syncMinMaxValues('max');
            } else {
                scope.priceschedule.PriceBreaks.splice(index, 1);
            }
            ocProductPricing.PriceBreaks.FormatQuantities(scope.priceschedule.PriceBreaks);
            scope.newBreakForm.Price.$setDirty();
        }

        function syncMinMaxValues(which) {
            var sortedPriceBreaks = $filter('orderBy')(angular.copy(scope.priceschedule.PriceBreaks), 'Quantity');
            switch (which) {
                case 'min':
                    scope.priceschedule.MinQuantity = sortedPriceBreaks[0].Quantity;
                    break;
                case 'max':
                    scope.priceschedule.MaxQuantity = sortedPriceBreaks[sortedPriceBreaks.length - 1].Quantity;
                    break;
                default:
                    scope.priceschedule.MinQuantity = sortedPriceBreaks[0].Quantity;
                    scope.priceschedule.MaxQuantity = sortedPriceBreaks[sortedPriceBreaks.length - 1].Quantity;
                    break;
            }
        }
    }

    return directive;
}