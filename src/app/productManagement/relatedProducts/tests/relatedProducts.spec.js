describe('Component: Related Products', function() {
    describe('State: RelatedProducts', function() {
        var relatedProductsState;
        beforeEach(function() {
            relatedProductsState = state.get('product.relatedProducts');
            spyOn(ocParametersService, 'Get');
            spyOn(oc.Products, 'List').and.returnValue(dummyPromise);
        });
        it('should resolve Parameters', function() {
            injector.invoke(relatedProductsState.resolve.Parameters);
            expect(ocParametersService.Get).toHaveBeenCalled();
        });
        it('should resolve ProductsList', function() {
            var parameters = {
                search: null,
                pageSize: null,
                page: null,
                searchOn: null,
                sortBy: null,
                filters: {},
                catalogID: null,
                categoryID: null,
                categoryPage: null,
                productPage: null
            };
            injector.invoke(relatedProductsState.resolve.ProductsList);
            expect(oc.Products.List).toHaveBeenCalledWith(parameters);
        });
    });
    describe('Controller: RelatedProductsCtrl', function() {
        var relatedProductsCtrl,
            productsList = {
                Items: [{ID: 'relProd1'}, {ID: 'relProd2'}],
                Meta: {Page: 1, PageSize: 15}
            };
        beforeEach(inject(function($controller) {
            relatedProductsCtrl = $controller('RelatedProductsCtrl', {
                SelectedProduct: mock.SelectedProduct,
                ProductsList: productsList
            });
            spyOn(oc.Products, 'Patch').and.returnValue(dummyPromise);
            spyOn(oc.Products, 'List').and.returnValue();
            spyOn(state, 'go');
        }));
        describe('vm.updateProduct', function() {
            it('should either remove or add the item from the array of related products on the selectedProduct', function() {
                var relatedProduct = productsList.Items[0].ID;
                relatedProductsCtrl.updateProduct(relatedProduct);
                scope.$digest();
                expect(oc.Products.Patch).toHaveBeenCalledWith(mock.Product.ID, {xp: {RelatedProducts: mock.SelectedProduct.xp.RelatedProducts}});
            });
        })
        describe('vm.pageChanged', function() {
            it('should go to the next page', function() {
                relatedProductsCtrl.pageChanged();
                expect(state.go).toHaveBeenCalledWith('product.relatedProducts', {page: productsList.Meta.Page}, {reload: true});
            });
        });
        describe('vm.loadMore', function() {
            it('should load more results', function() {
                var parameters = {
                    search: null,
                    page: 2,
                    pageSize: null,
                    searchOn: null,
                    sortBy: null,
                    filters: {},
                    catalogID: null,
                    categoryID: null,
                    categoryPage: null,
                    productPage: null,
                };
                relatedProductsCtrl.loadMore();
                expect(oc.Products.List).toHaveBeenCalledWith(parameters);
            });
        });
    });
})