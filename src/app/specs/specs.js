angular.module('orderCloud')
    .config(SpecsConfig)
    .controller('SpecsCtrl', SpecsController)
    .controller('SpecEditCtrl', SpecEditController)
    .controller('SpecCreateCtrl', SpecCreateController)
    .controller('SpecAssignCtrl', SpecAssignController)
;

function SpecsConfig($stateProvider) {
    $stateProvider
        .state('specs', {
            parent: 'base',
            views: {
                '': {
                    templateUrl: 'specs/templates/specs.tpl.html',
                    controller: 'SpecsCtrl',
                    controllerAs: 'specs'
                },
                'filters@specs': {
                    templateUrl: 'specs/templates/specs.filters.tpl.html'
                },
                'list@specs': {
                    templateUrl: 'specs/templates/specs.list.tpl.html'
                }
            },
            url: '/specs?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Specs'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                SpecList: function(OrderCloud, Parameters) {
                    return OrderCloud.Specs.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('specs.edit', {
            url: '/:specid/edit',
            templateUrl: 'specs/templates/specEdit.tpl.html',
            controller: 'SpecEditCtrl',
            controllerAs: 'specEdit',
            resolve: {
                SelectedSpec: function($stateParams, OrderCloud) {
                    return OrderCloud.Specs.Get($stateParams.specid);
                },
                SelectedOpts: function(OrderCloud, SelectedSpec){
                    return OrderCloud.Specs.ListOptions(SelectedSpec.ID)
                }
            }
        })
        .state('specs.create', {
            url: '/create',
            templateUrl: 'specs/templates/specCreate.tpl.html',
            controller: 'SpecCreateCtrl',
            controllerAs: 'specCreate'
        })
        .state('specs.assign', {
            url: '/:specid/assign',
            templateUrl: 'specs/templates/specAssign.tpl.html',
            controller: 'SpecAssignCtrl',
            controllerAs: 'specAssign',
            resolve: {
                ProductList: function(OrderCloud) {
                    return OrderCloud.Products.List(null, 1, 20);
                },
                ProductAssignments: function($stateParams, OrderCloud) {
                    return OrderCloud.Specs.ListProductAssignments($stateParams.specid);
                },
                SelectedSpec: function($stateParams, OrderCloud) {
                    return OrderCloud.Specs.Get($stateParams.specid);
                }
            }
        })
    ;
}

function SpecsController($state, $ocMedia, OrderCloud, OrderCloudParameters, Parameters, SpecList) {
    var vm = this;
    vm.list = SpecList;
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
        return OrderCloud.Specs.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function SpecEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedSpec, SelectedOpts) {
    var vm = this,
        specid = angular.copy(SelectedSpec.ID);
    vm.specName = angular.copy(SelectedSpec.Name);
    vm.spec = SelectedSpec;
    vm.Option = {};
    vm.Options = SelectedOpts.Items;
    vm.overwrite = false;

    vm.addSpecOpt = function() {

        if (_.where(vm.Options, {ID: vm.Option.ID}).length) {
            vm.overwrite = true;
            toastr.warning('There is already a spec option with that ID, select Update Spec Option to continue', 'Warning');
        }

        if (!_.where(vm.Options, {ID: vm.Option.ID}).length) {
            vm.Options.push(vm.Option);
            if (vm.DefaultOptionID) {
                vm.spec.DefaultOptionID = vm.Option.ID;
            }
            OrderCloud.Specs.CreateOption(specid, vm.Option)
                .then(function() {
                    vm.Option = null;
                    vm.DefaultOptionID = null;
                });
        }
    };

    vm.updateSpecOpt = function() {
        var specOptIndex;

        if (_.where(vm.Options, {ID: vm.Option.ID}).length) {
            angular.forEach(vm.Options, function(option, index) {
                if (option.ID == vm.Option.ID) {
                    specOptIndex = index;
                }
            });

            vm.Options.splice(specOptIndex, 1);
            vm.Options.push(vm.Option);
            if (vm.DefaultOptionID) {
                vm.spec.DefaultOptionID = vm.Option.ID;
            }
            OrderCloud.Specs.UpdateOption(specid, vm.Option.ID, vm.Option)
                .then(function() {
                    vm.Option = null;
                    vm.DefaultOptionID = null;
                    vm.overwrite = false;
                });
        } else {
            vm.overwrite = false;
            vm.addSpecOpt();
        }
    };

    vm.deleteSpecOpt = function($index) {
        if (vm.spec.DefaultOptionID == vm.Options[$index].ID) {
            vm.spec.DefaultOptionID = null;
        }
        OrderCloud.Specs.DeleteOption(specid, vm.Options[$index].ID)
            .then(function() {
                vm.Options.splice($index, 1);
            });
    };

    vm.Submit = function() {
        OrderCloud.Specs.Update(specid, vm.spec)
            .then(function() {
                $state.go('specs', {}, {reload: true});
                toastr.success('Spec Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.Specs.Delete(specid)
            .then(function() {
                toastr.success('Spec Deleted', 'Success');
                $state.go('specs', {}, {reload: true})
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function SpecCreateController($exceptionHandler, $q, $state, toastr, OrderCloud) {
    var vm = this;
    vm.spec = {};
    vm.Options = [];
    var DefaultOptionID;
    vm.overwrite = false;

    vm.addSpecOpt = function() {
        if (_.where(vm.Options, {ID: vm.Option.ID}).length) {
            vm.overwrite = true;
            toastr.warning('There is already a spec option with that ID, select Update Spec Option to continue', 'Warning');
        }
        if (!_.where(vm.Options, {ID: vm.Option.ID}).length) {
            vm.Options.push(vm.Option);
            if (vm.DefaultOptionID) {
                DefaultOptionID = vm.Option.ID;
            }
            vm.Option = null;
            vm.DefaultOptionID = null;
        }
    };

    vm.updateSpecOpt = function() {
        var specOptIndex;

        if (_.where(vm.Options, {ID: vm.Option.ID}).length) {
            angular.forEach(vm.Options, function(option, index) {
                if (option.ID == vm.Option.ID) {
                    specOptIndex = index;
                }
            });

            vm.Options.splice(specOptIndex, 1);
            vm.Options.push(vm.Option);
            if (vm.DefaultOptionID) {
                vm.spec.DefaultOptionID = vm.Option.ID;
            }
            vm.Option = null;
            vm.overwrite = false;
        } else {
            vm.addSpecOpt();
        }
    };

    vm.deleteSpecOpt = function($index) {
        if (vm.spec.DefaultOptionID == vm.Options[$index].ID) {
            vm.spec.DefaultOptionID = null;
        }
        vm.Options.splice($index, 1);
    };

    vm.Submit = function() {
        OrderCloud.Specs.Create(vm.spec)
            .then(function(spec) {
                var queue = [],
                    dfd = $q.defer();
                angular.forEach(vm.Options, function(opt) {
                    queue.push(OrderCloud.Specs.CreateOption(spec.ID, opt));
                });
                $q.all(queue).then(function() {
                    dfd.resolve();
                    if (DefaultOptionID != null) {
                        OrderCloud.Specs.Patch(spec.ID, {DefaultOptionID: DefaultOptionID})
                    }
                    $state.go('specs', {}, {reload: true});
                    toastr.success('Spec Created', 'Success');
                });
                return dfd.promise;
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}
function SpecAssignController($scope, toastr, OrderCloud, Assignments, Paging, ProductList, ProductAssignments, SelectedSpec) {
    var vm = this;
    vm.Spec = SelectedSpec;
    vm.list = ProductList;
    vm.assignments = ProductAssignments;
    vm.saveAssignments = SaveAssignment;
    vm.pagingfunction = PagingFunction;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'ProductID')
    });

    function SaveFunc(ItemID) {
        return OrderCloud.Specs.SaveProductAssignment({
            SpecID: vm.Spec.ID,
            ProductID: ItemID
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloud.Specs.DeleteProductAssignment(vm.Spec.ID, ItemID);
    }

    function SaveAssignment() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'ProductID');
    }

    function AssignmentFunc() {
        return OrderCloud.Specs.ListProductAssignments(vm.Spec.ID, null, vm.assignments.Meta.PageSize);
    }

    function PagingFunction() {
        return Paging.Paging(vm.list, 'Products', vm.assignments, AssignmentFunc);
    }
}
