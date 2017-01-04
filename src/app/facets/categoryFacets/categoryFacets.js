angular.module('orderCloud')
    .config(CategoryFacetsConfig)
    .controller('CategoryFacetsCtrl', CategoryFacetsController)
    .controller('CategoryFacetsManageCtrl', FacetedCategoryManageController)
    .controller('CategoryFacetsModalCtrl', CategoryFacetsModalController)
;

function CategoryFacetsConfig($stateProvider) {
    $stateProvider
        .state('categoryFacets', {
            parent: 'base',
            templateUrl: 'facets/categoryFacets/templates/categoryFacets.tpl.html',
            controller: 'CategoryFacetsCtrl',
            controllerAs: 'facetedCat',
            url: '/categoryfacets?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Category Facets'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                CategoryList: function(OrderCloud, Parameters) {
                    return OrderCloud.Categories.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('categoryFacets.manage', {
            url: '/:categoryid/manage',
            templateUrl: 'facets/categoryFacets/templates/categoryFacetsManage.tpl.html',
            controller: 'CategoryFacetsManageCtrl',
            controllerAs: 'facetedCatManage',
            data: {componentName: 'Category Facets'},
            resolve: {
                Category: function($stateParams, OrderCloud) {
                    return OrderCloud.Categories.Get($stateParams.categoryid);
                }
            }
        })
    ;
}

function CategoryFacetsController($state, $ocMedia, OrderCloud, OrderCloudParameters, CategoryList, Parameters) {
    var vm = this;
    vm.list = CategoryList;

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

function FacetedCategoryManageController ($state, $uibModal, toastr, OrderCloud, Category) {
    var vm = this;
    Category.xp && Category.xp.OC_Facets ? vm.list = Category.xp.OC_Facets : vm.list = null;
    vm.category = Category;
    vm.facetValues = [];
    vm.isRequired = false;

    vm.createFacetModal = function() {
        var modalInstance = $uibModal.open({
            templateUrl: 'facets/categoryFacets/templates/categoryFacets.modal.tpl.html',
            controller: 'CategoryFacetsModalCtrl',
            controllerAs: 'catFacetModal'
        });

        modalInstance.result.then(function(facetToSave) {
            if (vm.category.xp == null) vm.category.xp = {OC_Facets: {}};
            if (vm.category.xp && !vm.category.xp.OC_Facets) vm.category.xp.OC_Facets = {};
            vm.category.xp.OC_Facets[facetToSave.facet.toLowerCase()] = {};
            vm.category.xp.OC_Facets[facetToSave.facet.toLowerCase()].Values = facetToSave.facetValues;
            vm.category.xp.OC_Facets[facetToSave.facet.toLowerCase()].isRequired = facetToSave.isRequired;
            OrderCloud.Categories.Update(vm.category.ID, vm.category)
                .then(function() {
                    toastr.success('Your category facet has been saved successfully');
                    $state.reload();
                });
        });
    };

    vm.addValueExisting = function(facetName, index) {
        vm.category.xp.OC_Facets[facetName].Values.push(vm[facetName].newFacetValue.toLowerCase());
        OrderCloud.Categories.Update(vm.category.ID, vm.category)
            .then(function() {
               vm[facetName].newFacetValue = null;
                $('#newFacetValue' + index).focus();
            });
    };

    vm.removeValueExisting = function(facetName, facetValueIndex) {
        vm.category.xp.OC_Facets[facetName].Values.splice(facetValueIndex, 1);
        OrderCloud.Categories.Update(vm.category.ID, vm.category);
    };

    vm.toggleFacetRequired = function(facetName) {
        vm.category.xp.OC_Facets[facetName].isRequired = !vm.category.xp.OC_Facets[facetName].isRequired;
        OrderCloud.Categories.Update(vm.category.ID, vm.category);
    };

    vm.deleteFacet = function(facetName) {
        if (confirm('Are you sure you want to delete this facet?')) {
            if (Object.keys(vm.category.xp.OC_Facets).length === 1) {
                delete vm.category.xp.OC_Facets;
                OrderCloud.Categories.Update(vm.category.ID, vm.category)
                    .then(function() {
                    var keyName = 'xp.OC_Facets.' + vm.category.ID + '.' + facetName;
                    var filterObj = {};
                    filterObj[keyName] = '*';
                    OrderCloud.Products.List(null, 1, 100, null,null, filterObj)
                        .then(function(matchingProds) {
                            console.log(matchingProds);
                            angular.forEach(_.uniq(matchingProds.Items, true, 'ID'), function(prod) {
                                delete prod.xp.OC_Facets[vm.category.ID];
                                OrderCloud.Products.Update(prod.ID, prod);
                            });
                        });
                });
            }
            else {
                delete vm.category.xp.OC_Facets[facetName];
                OrderCloud.Categories.Update(vm.category.ID, vm.category)
                    .then(function() {
                        var keyName = 'xp.OC_Facets.' + vm.category.ID + '.' + facetName;
                        var filterObj = {};
                        filterObj[keyName] = '*';
                        OrderCloud.Products.List(null, 1, 100, null, null, filterObj)
                            .then(function(matchingProds) {
                                angular.forEach(_.uniq(matchingProds.Items, true, 'ID'), function(prod) {
                                    delete prod.xp.OC_Facets[vm.category.ID][facetName];
                                    OrderCloud.Products.Update(prod.ID, prod);
                                });
                            });
                    });
            }

        }
        else {
            //do nothing
        }
    };
}

function CategoryFacetsModalController($uibModalInstance) {
    var vm = this;
    vm.facetValues = [];
    vm.isRequired = false;
    vm.facetValue = null;
    vm.facet = null;

    vm.addValue = function() {
        if (vm.facetValue != null) {
            vm.facetValues.push(vm.facetValue);
            vm.facetValue = null;
            $('#facetValue').focus();
        }
    };

    vm.removeValue = function(index) {
        vm.facetValues.splice(index, 1);
    };

    vm.save = function() {
        var facetToSave = {
            facet: vm.facet,
            facetValues: vm.facetValues,
            isRequired: vm.isRequired
        };
        $uibModalInstance.close(facetToSave);
    };

    vm.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
}
