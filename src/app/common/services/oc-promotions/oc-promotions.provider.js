angular.module('orderCloud')
    .provider('$ocPromotions', OrderCloudPromotionsProvider)
;

function OrderCloudPromotionsProvider() {
    var promotionTemplates = [];

    return {
        $get: function() {
             return {
                 GetPromotionTemplates: function() {
                    return promotionTemplates;
                 }
             };
        },
        AddPromotionTemplate: function(promotionTemplate) {
             if (!promotionTemplate.Name) throw 'ocPromotions: PromotionTemplate must have a Name value';
             if (!promotionTemplate.Description) throw 'ocPromotions: PromotionTemplate must have a Description value';

             promotionTemplates.push(promotionTemplate);
        }
    };

}