angular.module('orderCloud')
    .controller('PromotionCreateModalCtrl', PromotionCreateModalController)
;

function PromotionCreateModalController($uibModalInstance, $ocPromotions, OrderCloudSDK, ocPromotions, SelectedBuyerID) {
    var vm = this;
    vm.promotion = {};
    vm.promotionTemplates = $ocPromotions.GetPromotionTemplates();

    vm.steps = [
        {
            form: 'info',
            name: 'Basic Information',
            next: true
        },
        {
            form: 'redemption',
            name: 'Redemption Details',
            next: true
        },
        {
            form: 'custom',
            name: 'Promotion Details',
            next: false
        }
    ];

    if (vm.promotionTemplates.length) {
        var typeStep = {
            form: 'type',
            name: 'Promotion Type',
            next: false
        };
        var preconfiguredStep = {
            form: 'preconfigured',
            name: 'Promotion Details',
            next: false
        };
        vm.steps.splice(2, 0, typeStep);
        vm.steps.splice(3, 0, preconfiguredStep);
    }

    vm.currentStep = 0;
    vm.showNext = true;
    vm.showPrev = false;
    vm.showSave = false;
    vm.initialized = true;

    vm.typeIndex = _.findIndex(vm.steps, function(step) { return step.form == 'type';});
    vm.preconfiguredIndex = _.findIndex(vm.steps, function(step) { return step.form == 'preconfigured';});
    vm.customIndex = _.findIndex(vm.steps, function(step) { return step.form == 'custom';});

    vm.nextStep = function () {
        vm.currentStep++;
        _checkPrevNex();
    };

    vm.prevStep = function () {
        if (vm.currentStep == vm.preconfiguredIndex || vm.currentStep == vm.customIndex && vm.promotionTemplates.length) {
            vm.showSave = false;
            vm.currentStep = vm.typeIndex;
        } else {
            vm.currentStep--;
        }
        _checkPrevNex();
    };

    function _checkPrevNex() {
        vm.showNext = vm.currentStep < vm.steps.length - 1;
        vm.showPrev = vm.currentStep > 0;
        vm.showSave = vm.currentStep == vm.steps.length - 1;
    }

    vm.selectedPromotionTemplate = null;
    vm.selectPromotionTemplate = function(promotionTemplate) {
        vm.selectedPromotionTemplate = angular.copy(promotionTemplate);
        if (vm.selectedPromotionTemplate.EligibleDisplayText && (!vm.selectedPromotionTemplate.EligibleFields || !vm.selectedPromotionTemplate.EligibleFields.length))
            vm.promotion.EligibleExpression = vm.selectedPromotionTemplate.EligibleExpression;
        if (vm.selectedPromotionTemplate.ValueDisplayText && (!vm.selectedPromotionTemplate.ValueFields || !vm.selectedPromotionTemplate.ValueFields.length))
            vm.promotion.ValueExpression = vm.selectedPromotionTemplate.ValueExpression;

        if ((vm.selectedPromotionTemplate.EligibleFields && _.find(vm.selectedPromotionTemplate.EligibleFields, {Typeahead: 'Categories'})) || (vm.selectedPromotionTemplate.ValueFields && _.find(vm.selectedPromotionTemplate.ValueFields, {Typeahead: 'Categories'}))) {
            OrderCloudSDK.Catalogs.List({page: 1, pageSize: 100})
                .then(function(data) {
                    vm.selectedPromotionTemplate.Catalogs = data.Items;
                });
        }

        vm.currentStep = vm.preconfiguredIndex;
        vm.showSave = true;
    };

    vm.typeahead = function(type, search) {
        if (type == 'Categories' && !vm.selectedCatalog) return;
        return ocPromotions.Typeahead[type](search, (vm.selectedCatalog ? vm.selectedCatalog.ID : null));
    };

    vm.customPromotion = function() {
        vm.selectedPromotionTemplate = null;
        vm.promotion.EligibleExpression = null;
        vm.promotion.ValueExpression = null;
        vm.currentStep = vm.customIndex;
        vm.showSave = true;
    };

    function replacePlaceholders(string, placeholder, replaceValue){
        placeholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp(placeholder, 'g');
        return string.replace(re, replaceValue);
    }

    vm.eligibleFieldChange = function() {
        var eligibleExpression = vm.selectedPromotionTemplate.EligibleExpression;
        angular.forEach(vm.selectedPromotionTemplate.EligibleFields, function(field, index) {
            eligibleExpression = replacePlaceholders(eligibleExpression, '{e' + index + '}', field.Value);
        });
        vm.promotion.EligibleExpression = eligibleExpression;
        vm.valueFieldChange();
    };

    vm.valueFieldChange = function() {
        var valueExpression = vm.selectedPromotionTemplate.ValueExpression;
        angular.forEach(vm.selectedPromotionTemplate.EligibleFields, function(field, index) {
            valueExpression = replacePlaceholders(valueExpression, '{e' + index + '}', field.Value);
        });
        angular.forEach(vm.selectedPromotionTemplate.ValueFields, function(field, index) {
            valueExpression = replacePlaceholders(valueExpression, '{v' + index + '}', field.Value);
        });
        vm.promotion.ValueExpression = valueExpression;
    };

    vm.submit = function() {
        vm.loading = OrderCloudSDK.Promotions.Create(vm.promotion)
            .then(function(newPromotion) {
                $uibModalInstance.close(newPromotion);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}