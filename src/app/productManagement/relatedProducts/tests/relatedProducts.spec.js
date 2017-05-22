fdescribe('Component: Related Products', function() {
    describe('State: RelatedProducts', function() {
        var relatedProductsState;
        beforeEach(function() {
            relatedProductsState = state.get('product.relatedProducts');
            spyOn(ocParametersService, 'Get');
            spyOn(oc.Products, 'List');
        });
        it('should resolve Parameters', function() {
            injector.invoke(relatedProductsState.resolve.Parameters);
            expect(ocParametersService.Get).toHaveBeenCalled();
        });
        it('should resolve RelatedProductsList', function() {
            var parameters = {
                filters: {
                    ID: selectedProduct.xp.RelatedProducts.join('|')
                }
            };
            injector.invoke(relatedProductsState.resolve.RelatedProductsList);
            expect(oc.Products.List).toHaveBeenCalledWith(parameters);
        });
    });
    describe('Controller: RelatedProductCtrl', function() {
        var relatedProductCtrl,
            relatedProductsList = {
                Items: [{ID: 'relProd1'}, {ID: 'relProd2'}]
            };
        beforeEach(inject(function($controller) {
            relatedProductCtrl = $controller('RelatedProductCtrl', {
                SelectedProduct: mock.SelectedProduct,
                RelatedProductsList: relatedProductsList
            });
        }));
        describe('vm.removeRelatedProduct', function() {
            beforeEach(function() {
                spyOn(oc.Products, 'Patch').and.returnValue(dummyPromise);
            });
            it('should remove the item from the array of related products on the selectedProduct', function() {
                var relatedProduct = relatedProductsList.Items[0].ID;
                relatedProductCtrl.removeRelatedProduct(relatedProduct);
                scope.$digest();
                expect(oc.Products.Patch).toHaveBeenCalledWith(mock.Product.ID, {xp: {RelatedProducts: mock.SelectedProduct.xp.RelatedProducts}});
            })
        })
        describe('vm.addRelatedProducts', function() {
            var relProd3;
            beforeEach(function() {
                spyOn(oc.Products, 'Patch').and.returnValue(dummyPromise);
            });
            it('should add product IDs to the array of related products on the selectedProduct', function() {
                var relatedProduct = relatedProductsList.Items[0].ID;
                var list = ['relProd1', 'relProd2', relProd3]
                relatedProductCtrl.addRelatedProducts(relatedProduct);
                scope.$digest();
                expect(oc.Products.Patch).toHaveBeenCalledWith(mock.Product.ID, {xp: {RelatedProducts: list}});
            })
        })
    });
})