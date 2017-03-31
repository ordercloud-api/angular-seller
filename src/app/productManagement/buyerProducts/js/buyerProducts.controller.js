angular.module('orderCloud')
    .controller('BuyerProductsCtrl', BuyerProductsController);

function BuyerProductsController($q, $exceptionHandler, $state, $stateParams, toastr, OrderCloud, sdkOrderCloud, ocParameters, ocProducts, ocProductPricing, SelectedBuyer, ProductList, Parameters, MappedProductList, CurrentAssignments, $uibModal) {
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
        return sdkOrderCloud.Products.List(parameters)
            .then(function (data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    }

    vm.createProduct = function () {
        ocProducts.Create()
            .then(function (newProduct) {
                toastr.success(newProduct.Name + ' was created.');
                $state.go('productDetail', {
                    productid: newProduct.ID
                });
            });
    };

    vm.updateProductPrice = function(scope) {
        var priceScheduleIDs = _.unique((scope.product.DefaultPriceScheduleID ? [scope.product.DefaultPriceScheduleID] : [])
                                        .concat(_.pluck(_.filter(CurrentAssignments, {ProductID:scope.product.ID}), 'PriceScheduleID')));
        
        if (priceScheduleIDs.length === 1 && priceScheduleIDs[0] === scope.product.DefaultPriceScheduleID) {
            _createProductPrice(scope);
        } else {
            $uibModal.open({
                templateUrl: 'productManagement/buyerProducts/templates/selectPrice.modal.html',
                controller: 'SelectPriceModalCtrl',
                controllerAs: 'selectPriceModal',
                resolve: {
                    SelectPriceData: function() {
                        var df = $q.defer();
                        var result = {
                            Buyer: SelectedBuyer,
                            Product: scope.product,
                            CurrentAssignments: CurrentAssignments
                        };
                        sdkOrderCloud.PriceSchedules.List({filters:{ID:priceScheduleIDs.join('|')}})
                            .then(function(data) {
                                result.PriceScheduleList = data;
                                df.resolve(result);
                            });
                        return df.promise;
                    }
                }
            }).result
                .then(function(data) {
                    CurrentAssignments = data.UpdatedAssignments;
                    scope.product.SelectedPrice = data.SelectedPrice;
                })
                .catch(function(ex) {
                    if (ex === 'CREATE') {
                        _createProductPrice(scope);
                    } else {
                        $exceptionHandler(ex);
                    }
                });
        }

        
    };

    function _createProductPrice(scope) {
        $uibModal.open({
            templateUrl: 'productManagement/buyerProducts/templates/createPrice.modal.html',
            controller: 'CreatePriceModalCtrl',
            controllerAs: 'createPriceModal',
            resolve: {
                SelectPriceData: function() {
                    return {
                        Buyer: SelectedBuyer,
                        Product: scope.product,
                        CurrentAssignments: CurrentAssignments
                    };
                }
            }
        }).result
            .then(function(data) {
                CurrentAssignments = data.UpdatedAssignments;
                scope.product.SelectedPrice = data.SelectedPrice;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    vm.selectionInputs = {};
    var availablePriceIDs = {};
    vm.searchPrices = function (product, searchTerm) {
        var df = $q.defer();
        if (!availablePriceIDs[product.ID]) {
            ocProductPricing.Assignments.Get(product.ID)
                .then(function (assignments) {
                    var priceScheduleIDs = _.pluck(assignments, 'PriceScheduleID');
                    priceScheduleIDs.push(product.DefaultPriceScheduleID);
                    availablePriceIDs[product.ID] = priceScheduleIDs;
                    _searchPriceSchedules();
                });
        } else if (!availablePriceIDs[product.ID].length) {
            df.resolve([]); //No available prices found
        } else {
            _searchPriceSchedules();
        }

        function _searchPriceSchedules() {
            var options = {
                search: searchTerm,
                filters: {
                    ID: availablePriceIDs[product.ID].join('|')
                }
            };
            sdkOrderCloud.PriceSchedules.List(options)
                .then(function (data) {
                    df.resolve(data.Items);
                });
        }
        return df.promise;
    };
}