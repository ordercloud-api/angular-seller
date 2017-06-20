angular.module('orderCloud')
    .controller('PromotionEditModalCtrl', PromotionEditModalController)
;

function PromotionEditModalController($uibModalInstance, OrderCloudSDK, ocPromotions, SelectedPromotion, SelectedBuyerID) {
    var vm = this;
    vm.promotion = angular.copy(SelectedPromotion);
    vm.promotionName = SelectedPromotion.Name ? SelectedPromotion.Name : SelectedPromotion.Code;

    vm.promotionTemplate = ocPromotions.MapTemplate(vm.promotion);
    if (vm.promotionTemplate && (vm.promotionTemplate.EligibleFields && _.find(vm.promotionTemplate.EligibleFields, {Typeahead: 'Categories'})) || (vm.promotionTemplate.ValueFields && _.find(vm.promotionTemplate.ValueFields, {Typeahead: 'Categories'}))) {
        OrderCloudSDK.Catalogs.List({page: 1, pageSize: 100})
            .then(function(data) {
                vm.promotionTemplate.Catalogs = data.Items;
            });
    }

    if (vm.promotion.StartDate) vm.promotion.StartDate = new Date(vm.promotion.StartDate);
    if (vm.promotion.ExpirationDate) vm.promotion.ExpirationDate = new Date(vm.promotion.ExpirationDate);

    function replacePlaceholders(string, placeholder, replaceValue){
        placeholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp(placeholder, 'g');
        return string.replace(re, replaceValue);
    }

    vm.eligibleFieldChange = function() {
        var eligibleExpression = vm.promotionTemplate.EligibleExpression;
        angular.forEach(vm.promotionTemplate.EligibleFields, function(field, index) {
            eligibleExpression = replacePlaceholders(eligibleExpression, '{e' + index + '}', field.Value);
        });
        vm.promotion.EligibleExpression = eligibleExpression;
        vm.valueFieldChange();
    };

    vm.valueFieldChange = function() {
        var valueExpression = vm.promotionTemplate.ValueExpression;
        angular.forEach(vm.promotionTemplate.EligibleFields, function(field, index) {
            valueExpression = replacePlaceholders(valueExpression, '{e' + index + '}', field.Value);
        });
        angular.forEach(vm.promotionTemplate.ValueFields, function(field, index) {
            valueExpression = replacePlaceholders(valueExpression, '{v' + index + '}', field.Value);
        });
        vm.promotion.ValueExpression = valueExpression;
    };

    vm.typeahead = function(type, search) {
        if (type == 'Categories' && !vm.selectedCatalog) return;
        return ocPromotions.Typeahead[type](search, (vm.selectedCatalog ? vm.selectedCatalog.ID : null));
    };

    vm.submit = function() {
        vm.loading = OrderCloudSDK.Promotions.Update(SelectedPromotion.ID, vm.promotion)
            .then(function(updatedPromotion) {
                $uibModalInstance.close(updatedPromotion);
            });
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss();
    };
}