angular.module('orderCloud')
    .config(function($ocPromotionsProvider) {
        var promotionTemplates = [
            {
                Name: "Percentage Off With Minimum Order Total",
                Description: "Provide your customers a % discount when their order total is greater than a configured amount.",
                EligibleExpression: "order.Total > {e0}",
                EligibleFields: [
                    {
                        Label: "Order Total",
                        Type: "number",
                        PrefixIcon: "fa-dollar"
                    }
                ],
                ValueExpression: "order.Total * .{v0}",
                ValueFields: [
                    {
                        Label: "Percentage Off",
                        Type: "number",
                        SuffixIcon: "fa-percent"
                    }
                ]
            },
            {
                Name: "Free Shipping",
                Description: "Provide your customers with free shipping when their order total is greater than a configured amount.",
                EligibleExpression: "order.Total > {e0}",
                EligibleFields: [
                    {
                        Label: "Order Total",
                        Type: "number",
                        PrefixIcon: "fa-dollar"
                    }
                ],
                ValueExpression: "order.ShippingCost",
                ValueDisplayText: "Customer will automatically receive free shipping when this promotion is applied."
            },
            {
                Name: "BOGO",
                Description: "Select a product to offer a 'Buy One, Get One Free' promotion.",
                EligibleExpression: "items.quantity(ProductID = '{e0}') > 1",
                EligibleFields: [
                    {
                        Label: "Product ID",
                        Type: "text",
                        Typeahead: 'Products'
                    }
                ],
                ValueExpression: "((items.quantity(ProductID='{e0}')/2) - (items.quantity(ProductID='{e0}') % 2 * .5)) * items.total (ProductID='{e0}') / items.quantity(ProductID='{e0}')",
                ValueDisplayText: "Customers will automatically receive the BOGO discount to the specified product when this promotion is applied."
            },
            {
                Name: "Percentage Off By Category",
                Description: "Provide your customers with a % discount for products within a specified category.",
                EligibleExpression: "items.any(product.incategory('{e0}'))",
                EligibleFields: [
                    {
                        Label: "CategoryID",
                        Type: "text",
                        Typeahead: 'Categories'
                    }
                ],
                ValueExpression: "items.total(product.incategory('{e0}')) * .{v0}",
                ValueFields: [
                    {
                        Label: "Percentage Off",
                        Type: "number",
                        SuffixIcon: "fa-percent"
                    }
                ]
            }
        ];

        angular.forEach(promotionTemplates, function(promotionTemplate) {
            $ocPromotionsProvider.AddPromotionTemplate(promotionTemplate);
        });
    })
;