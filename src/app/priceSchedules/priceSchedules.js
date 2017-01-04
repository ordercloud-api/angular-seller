angular.module('orderCloud')
    .config(PriceSchedulesConfig)
    .controller('PriceSchedulesCtrl', PriceSchedulesController)
    .controller('PriceScheduleEditCtrl', PriceScheduleEditController)
    .controller('PriceScheduleCreateCtrl', PriceScheduleCreateController)
    .controller('PriceScheduleCreateModalCtrl', PriceScheduleCreateModalController)
;

function PriceSchedulesConfig($stateProvider) {
    $stateProvider
        .state('priceSchedules', {
            parent: 'base',
            url: '/priceschedules?search&page&pageSize&sortBy&searchOn&filters',
            templateUrl: 'priceSchedules/templates/priceSchedules.tpl.html',
            controller: 'PriceSchedulesCtrl',
            controllerAs: 'priceSchedules',
            data: {componentName: 'Price Schedules'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                PriceScheduleList: function(OrderCloud, Parameters) {
                    return OrderCloud.PriceSchedules.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('priceSchedules.edit', {
            url: '/:pricescheduleid/edit',
            templateUrl: 'priceSchedules/templates/priceScheduleEdit.tpl.html',
            controller: 'PriceScheduleEditCtrl',
            controllerAs: 'priceScheduleEdit',
            resolve: {
                SelectedPriceSchedule: function($stateParams, OrderCloud) {
                    return OrderCloud.PriceSchedules.Get($stateParams.pricescheduleid);
                }
            }
        })
        .state('priceSchedules.create', {
            url: '/create',
            templateUrl: 'priceSchedules/templates/priceScheduleCreate.tpl.html',
            controller: 'PriceScheduleCreateCtrl',
            controllerAs: 'priceScheduleCreate'
        })
    ;
}

function PriceSchedulesController($state, $ocMedia, $uibModal, OrderCloud, OrderCloudParameters, PriceScheduleList, Parameters) {
    var vm = this;
    vm.list = PriceScheduleList;
    console.log('schedules list', vm.list);
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
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
        return OrderCloud.PriceSchedules.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

}

function PriceScheduleEditController($scope, $exceptionHandler, $state, toastr, OrderCloud, SelectedPriceSchedule, PriceBreak) {
    var vm = this,
        priceScheduleid = angular.copy(SelectedPriceSchedule.ID);
    vm.priceScheduleName = angular.copy(SelectedPriceSchedule.Name);
    vm.priceSchedule = SelectedPriceSchedule;
    vm.priceSchedule.MinQuantity =1;

    vm.addPriceBreak = function() {
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    };

    PriceBreak.AddDisplayQuantity(vm.priceSchedule);

    vm.deletePriceBreak = PriceBreak.DeletePriceBreak;

    vm.Submit = function() {
        vm.priceSchedule = PriceBreak.SetMinMax(vm.priceSchedule);
        OrderCloud.PriceSchedules.Update(priceScheduleid, vm.priceSchedule)
            .then(function() {
                $state.go('priceSchedules', {}, {reload: true});
                toastr.success('Price Schedule Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.PriceSchedules.Delete(priceScheduleid)
            .then(function() {
                $state.go('priceSchedules', {}, {reload: true});
                toastr.success('Price Schedule Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    $scope.$watch(function() {
        return vm.priceSchedule.RestrictedQuantity;
    },function(value) {
        if (vm.priceSchedule.RestrictedQuantity) {
            vm.priceHeader = 'Total Price';
        } else {
            vm.priceHeader =  'Price Per Unit';
        }
    });

}

function PriceScheduleCreateController($scope, $exceptionHandler, $state, toastr, OrderCloud, PriceBreak) {
    var vm = this;
    vm.priceSchedule = {};
    vm.priceSchedule.RestrictedQuantity = false;
    vm.priceSchedule.PriceBreaks = [];
    vm.priceSchedule.MinQuantity = 1;
    vm.priceSchedule.OrderType = 'Standard';

    vm.addPriceBreak = function() {
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    };

    vm.deletePriceBreak = PriceBreak.DeletePriceBreak;

    vm.Submit = function() {
        vm.priceSchedule = PriceBreak.SetMinMax(vm.priceSchedule);
        OrderCloud.PriceSchedules.Create(vm.priceSchedule)
            .then(function() {
                $state.go('priceSchedules', {}, {reload: true});
                toastr.success('Price Schedule Created', 'Success')
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    $scope.$watch(function() {
        return vm.priceSchedule.RestrictedQuantity;
    },function(value) {
        if (vm.priceSchedule.RestrictedQuantity) {
            vm.priceHeader = 'Total Price';
        } else {
            vm.priceHeader =  'Price Per Unit';
        }
    });
}


function PriceScheduleCreateModalController($scope, $exceptionHandler, $uibModalInstance, $state, toastr, OrderCloud, PriceBreak) {
    var vm = this;
    vm.priceSchedule = {};
    vm.priceSchedule.RestrictedQuantity = false;
    vm.priceSchedule.PriceBreaks = [];
    vm.priceSchedule.MinQuantity = 1;
    vm.priceSchedule.OrderType = 'Standard';
    //vm.priceSchedule = SelectedPriceSchedule;

    vm.addPriceBreak = function() {
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    };

    vm.deletePriceBreak = PriceBreak.DeletePriceBreak;

    vm.savePriceSchedule = function() {
        vm.priceSchedule = PriceBreak.SetMinMax(vm.priceSchedule);
        OrderCloud.PriceSchedules.Create(vm.priceSchedule)
            .then(function() {
                vm.submit();
                $state.reload();
                toastr.success('Price Schedule Created', 'Success')
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    $scope.$watch(function() {
        return vm.priceSchedule.RestrictedQuantity;
    },function(value) {
        if (vm.priceSchedule.RestrictedQuantity) {
            vm.priceHeader = 'Total Price';
        } else {
            vm.priceHeader =  'Price Per Unit';
        }
    });

    vm.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };

    vm.submit = function() {
        $uibModalInstance.close();
    };
}
