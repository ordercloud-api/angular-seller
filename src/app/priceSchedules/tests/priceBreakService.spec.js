describe('Factory: PriceBreak', function() {
    var q,
        scope,
        priceSchedule,
        quantities,
        priceBreakService;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope) {
        q = $q;
        scope = $rootScope.$new();
        priceSchedule = {
            ID: "TestPriceSchedule123456789",
            Name: "TestPriceSchedule123456789",
            ApplyTax: true,
            ApplyShipping: false,
            MinQuantity: null,
            MaxQuantity: null,
            UseCumulativeQuantity: false,
            RestrictedQuantity: false,
            OrderType: "Standard",
            PriceBreaks: [
                {
                    Quantity: 1,
                    Price: 5.0
                },
                {
                    Quantity: 2,
                    Price: 4.5
                },
                {
                    Quantity: 3,
                    Price: 4.0
                },
                {
                    Quantity: 4,
                    Price: 3.5
                }
            ]
        };
    }));
    describe('SetMinMax', function() {
        beforeEach(inject(function(PriceBreak) {
            priceBreakService = PriceBreak;
            priceSchedule.RestrictedQuantity = true;
            priceBreakService.SetMinMax(priceSchedule);
        }));
        it('should set Min and Max Quantity', function() {
            expect(priceSchedule.MinQuantity).toEqual(1);
            expect(priceSchedule.MaxQuantity).toEqual(4);
        });
    });

    describe('AddPriceBreak', function() {
        beforeEach(inject(function(PriceBreak) {
            var price = 3;
            var quantity = 5;
            priceBreakService = PriceBreak;
            priceSchedule.RestrictedQuantity = true;
            priceBreakService.AddPriceBreak(priceSchedule, price, quantity);
        }));
        it('should set Min and Max Quantity', function() {
            expect(priceSchedule.MinQuantity).toEqual(1);
            expect(priceSchedule.MaxQuantity).toEqual(4);
        });
        it('should add a PriceBreak', function() {
            expect(priceSchedule.PriceBreaks.length).toEqual(4);
        });
    });

    describe('DeletePriceBreak', function() {
        beforeEach(inject(function(PriceBreak) {
            var index = 3;
            priceBreakService = PriceBreak;
            priceSchedule.RestrictedQuantity = true;
            priceBreakService.DeletePriceBreak(priceSchedule, index);
        }));
        it('should set Min and Max Quantity', function() {
            expect(priceSchedule.MinQuantity).toEqual(1);
            expect(priceSchedule.MaxQuantity).toEqual(3);
        });
        it('should delete a PriceBreak', function() {
            expect(priceSchedule.PriceBreaks.length).toEqual(3);
        });
    });

});