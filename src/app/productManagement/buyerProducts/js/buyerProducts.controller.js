angular.module('orderCloud')
    .controller('BuyerProductsCtrl', BuyerProductsController);

function BuyerProductsController($q, $exceptionHandler, $state, $stateParams, $filter, toastr, OrderCloudSDK, ocParameters, ocProducts, ocProductPricing, SelectedBuyer, ProductList, Parameters, MappedProductList, CurrentAssignments, $uibModal) {
    var vm = this;
    vm.list = MappedProductList;
    //Set parameters
    vm.parameters = Parameters;
    //Sort by is a filter on mobile devices
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') === 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    vm.clearSearch = clearSearch; //Clear the search parameter, reload the state & reset the page
    vm.filter = filter; //Reload the state with new parameters
    vm.loadMore = loadMore; //Load the next page of results with all of the same parameters
    vm.pageChanged = pageChanged; //Reload the state with the incremented page parameter
    vm.search = search; //Reload the state with new search parameter & reset the page
    vm.updateSort = updateSort; //Conditionally set, reverse, remove the sortBy parameter & reload the state

    function filter(resetPage) {
        $state.go('.', ocParameters.Create(vm.parameters, resetPage));
    }

    function search() {
        vm.filter(true);
    }

    function clearSearch() {
        vm.parameters.search = null;
        vm.filter(true);
    }

    function updateSort(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch (vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    }

    function pageChanged() {
        $state.go('.', {
            page: vm.list.Meta.Page
        });
    }

    function loadMore() {
        var parameters = angular.extend(Parameters, {page:vm.list.Meta.Page + 1, filters:{Active:undefined}});
        return OrderCloudSDK.Products.List(parameters)
            .then(function (data) {
                vm.list.Items = vm.list.Items.concat(ocProductPricing.Assignments.Map($stateParams.buyerid, null, data, CurrentAssignments, data));
                vm.list.Meta = data.Meta;
            });
    }

    vm.createProduct = function () {
        ocProducts.Create()
            .then(function (newProduct) {
                toastr.success(newProduct.Name + ' was created.');
                $state.go('product', {
                    productid: newProduct.ID
                });
            });
    };

    vm.updateProductPrice = function(scope) {
        ocProductPricing.UpdateProductPrice(scope.product, SelectedBuyer, CurrentAssignments)
            .then(function(data) {
                var message = scope.product.Name + ' price was ' + (data.SelectedPrice ? 
                    'updated to ' + $filter('currency')(data.SelectedPrice.PriceBreaks[0].Price) : 
                    'removed ') + ' for ' + SelectedBuyer.Name;
                toastr.success(message);
                CurrentAssignments = data.UpdatedAssignments;
                scope.product.SelectedPrice = data.SelectedPrice;
            })
            .catch(function(ex) {
                if (ex === 'CREATE') {
                    ocProductPricing.CreateProductPrice(scope.product, SelectedBuyer, CurrentAssignments)
                        .then(function(data) {
                            toastr.success(scope.product.Name + ' price was updated to ' + $filter('currency')(data.SelectedPrice.PriceBreaks[0].Price) + ' for ' + SelectedBuyer.Name);
                            CurrentAssignments = data.UpdatedAssignments;
                            scope.product.SelectedPrice = data.SelectedPrice;
                        })
                        .catch(function(ex) {
                            $exceptionHandler(ex);
                        });
                } else {
                    $exceptionHandler(ex);
                }
            });
    };
}