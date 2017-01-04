angular.module('orderCloud')
    .config(ProductFacetsConfig)
    .controller('ProductFacetsCtrl', ProductFacetsController)
    .controller('ProductFacetsManageCtrl', FacetedProductManageController)
;

function ProductFacetsConfig($stateProvider) {
    $stateProvider
        .state('productFacets', {
            parent: 'base',
            templateUrl: 'facets/productFacets/templates/productFacets.tpl.html',
            controller: 'ProductFacetsCtrl',
            controllerAs: 'facetedProd',
            url: '/productfacets?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Product Facets'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                ProductList: function(OrderCloud, Parameters) {
                    return OrderCloud.Products.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('productFacets.manage', {
            url: '/:productid/manage',
            templateUrl: 'facets/productFacets/templates/productFacetsManage.tpl.html',
            controller: 'ProductFacetsManageCtrl',
            controllerAs: 'facetedProdManage',
            data: {componentName: 'Product Facets'},
            resolve: {
                Product: function($stateParams, OrderCloud) {
                    return OrderCloud.Products.Get($stateParams.productid);
                },
                AssignedCategories: function($q, $stateParams, OrderCloud) {
                    var dfd = $q.defer();
                    var assignedCategories = [];
                    OrderCloud.Categories.ListProductAssignments(null, $stateParams.productid)
                        .then(function(categories) {
                            angular.forEach(categories.Items, function(cat) {
                                assignedCategories.push(OrderCloud.Categories.Get(cat.CategoryID))
                            });
                            $q.all(assignedCategories)
                                .then(function(results) {
                                    dfd.resolve(results);
                                });
                        });
                    return dfd.promise
                }
            }
        })
    ;
}

function ProductFacetsController($state, $ocMedia, OrderCloud, OrderCloudParameters,  ProductList, Parameters) {
    var vm = this;
    vm.list = ProductList;

    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
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
    };

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.Products.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function FacetedProductManageController ($state, toastr, OrderCloud, Product, AssignedCategories) {
    var vm = this;
    vm.assignedCategories = AssignedCategories;
    vm.product = Product;
    if (vm.product.xp == null) vm.product.xp = {OC_Facets: {}};
    if (vm.product.xp && !vm.product.xp.OC_Facets) vm.product.xp.OC_Facets = {};

    vm.setSelected = function(cat, facetName, facetValue) {
        var selected = false;
        if (vm.product.xp.OC_Facets[cat.ID] && vm.product.xp.OC_Facets[cat.ID][facetName]) {
            selected = vm.product.xp.OC_Facets[cat.ID][facetName].indexOf(facetValue) > -1
        }
        return selected;
    };

    vm.toggleSelection = function(cat, facetName, facetValue) {
        var selected = vm.setSelected(cat, facetName, facetValue);
        selected = !selected;
        if (selected && vm.product.xp.OC_Facets[cat.ID]) {
            if (vm.product.xp.OC_Facets[cat.ID][facetName]) {
                vm.product.xp.OC_Facets[cat.ID][facetName].push(facetValue);
            } else if (!vm.product.xp.OC_Facets[cat.ID][facetName]) {
                vm.product.xp.OC_Facets[cat.ID][facetName] = [];
                vm.product.xp.OC_Facets[cat.ID][facetName].push(facetValue);
            }
        } else if (selected && !vm.product.xp.OC_Facets[cat.ID]) {
            vm.product.xp.OC_Facets[cat.ID] = {};
            vm.product.xp.OC_Facets[cat.ID][facetName] = [];
            vm.product.xp.OC_Facets[cat.ID][facetName].push(facetValue);
        }
        else {
            vm.product.xp.OC_Facets[cat.ID][facetName].splice(vm.product.xp.OC_Facets[cat.ID][facetName].indexOf(facetValue), 1);
        }
    };

    vm.requiredFacet = function(cat) {
        var disabled = false;
        if (cat.xp && cat.xp.OC_Facets) {
            angular.forEach((cat.xp.OC_Facets), function(facetValues, facet) {
                if (facetValues.isRequired && vm.product.xp.OC_Facets[cat.ID] && vm.product.xp.OC_Facets[cat.ID][facet] && vm.product.xp.OC_Facets[cat.ID][facet].length == 0) {
                    disabled = true;
                }
            });
        }
        return disabled;
    };

    vm.saveSelections = function() {
        (OrderCloud.Products.Update(vm.product.ID, vm.product))
            .then(function() {
                toastr.success('Your product facets have been saved successfully');
                $state.go($state.current, {}, {reload: true});
            });
    };

    vm.addValueExisting = function(cat, facetName) {
        cat.xp.OC_Facets[facetName].Values.push(vm.newFacetValue[facetName].toLowerCase());
        OrderCloud.Categories.Update(cat.ID, cat)
            .then(function() {
                if (!vm.product.xp.OC_Facets) vm.product.xp.OC_Facets = {};
                if (!vm.product.xp.OC_Facets[cat.ID]) vm.product.xp.OC_Facets[cat.ID] = {};
                if (!vm.product.xp.OC_Facets[cat.ID][facetName]) vm.product.xp.OC_Facets[cat.ID][facetName] = [];
                vm.product.xp.OC_Facets[cat.ID][facetName].push(vm.newFacetValue[facetName].toLowerCase());
                OrderCloud.Products.Update(vm.product.ID, vm.product)
                    .then(function() {
                        vm.newFacetValue[facetName] = null;
                        $state.go($state.current, {}, {reload: true});
                    });
            });
    };
}
