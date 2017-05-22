describe('Component: Related Products', function() {
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
                },
                pageSize: 15,
                page: 1
            };
            injector.invoke(relatedProductsState.resolve.RelatedProductsList);
            expect(oc.Products.List).toHaveBeenCalledWith(parameters);
        });
    });
    describe('Controller: RelatedProductCtrl', function() {
        var relatedProductCtrl,
            relatedProductsList = {
                Items: [{ID: 'relProd1'}, {ID: 'relProd2'}],
                Meta: {Page: 1, PageSize: 15}
            };
        beforeEach(inject(function($controller) {
            relatedProductCtrl = $controller('RelatedProductCtrl', {
                SelectedProduct: mock.SelectedProduct,
                RelatedProductsList: relatedProductsList
            });
            spyOn(oc.Products, 'Patch').and.returnValue(dummyPromise);
            spyOn(oc.Products, 'List').and.returnValue(dummyPromise);
            spyOn(state, 'go');
        }));
        describe('vm.removeRelatedProduct', function() {
            it('should remove the item from the array of related products on the selectedProduct', function() {
                var relatedProduct = relatedProductsList.Items[0].ID;
                relatedProductCtrl.removeRelatedProduct(relatedProduct);
                scope.$digest();
                expect(oc.Products.Patch).toHaveBeenCalledWith(mock.Product.ID, {xp: {RelatedProducts: mock.SelectedProduct.xp.RelatedProducts}});
            });
        })
        describe('vm.addRelatedProducts', function() {
            var relProd3;
            it('should add product IDs to the array of related products on the selectedProduct', function() {
                var relatedProduct = relatedProductsList.Items[0].ID;
                var list = ['relProd1', 'relProd2', relProd3];
                relatedProductCtrl.addRelatedProducts(relatedProduct);
                scope.$digest();
                expect(oc.Products.Patch).toHaveBeenCalledWith(mock.Product.ID, {xp: {RelatedProducts: list}});
            });
        });
        describe('vm.listAllProducts', function() {
            var product;
            it('should list all products', function() {
                var parameters = {
                    pageSize: 100,
                    page: 1,
                    search: product
                };
                relatedProductCtrl.listAllProducts();
                expect(oc.Products.List).toHaveBeenCalledWith(parameters);
            });
        });
        describe('vm.pageChanged', function() {
            it('should go to the next page', function() {
                relatedProductCtrl.pageChanged();
                expect(state.go).toHaveBeenCalledWith('product.relatedProducts', {page: relatedProductsList.Meta.Page}, {reload: true});
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
                    filters: {
                        ID: mock.SelectedProduct.xp.RelatedProducts.join('|')
                    },
                    catalogID: null,
                    categoryID: null,
                    categoryPage: null,
                    productPage: null,
                };
                relatedProductCtrl.loadMore();
                expect(oc.Products.List).toHaveBeenCalledWith(parameters);
            });
        });
    });
})