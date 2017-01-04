angular.module('orderCloud')
    .config(CreditCardsConfig)
    .factory('creditCardExpirationDate', creditCardExpirationDate)
    .controller('CreditCardsCtrl', CreditCardsController)
    .controller('CreditCardEditCtrl', CreditCardEditController)
    .controller('CreditCardCreateCtrl', CreditCardCreateController)
    .controller('CreditCardAssignCtrl', CreditCardAssignController)
;

function CreditCardsConfig($stateProvider) {
    $stateProvider
        .state('creditCards', {
            parent: 'base',
            templateUrl: 'creditCards/templates/creditCards.tpl.html',
            controller: 'CreditCardsCtrl',
            controllerAs: 'creditCards',
            url: '/creditcards?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Credit Cards'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                CreditCardList: function(OrderCloud, Parameters) {
                    return OrderCloud.CreditCards.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy);
                }
            }
        })
        .state('creditCards.edit', {
            url: '/:creditcardid/edit',
            templateUrl: 'creditCards/templates/creditCardEdit.tpl.html',
            controller: 'CreditCardEditCtrl',
            controllerAs: 'creditCardEdit',
            resolve: {
                SelectedCreditCard: function($stateParams, OrderCloud) {
                    return OrderCloud.CreditCards.Get($stateParams.creditcardid);
                }
            }
        })
        .state('creditCards.create', {
            url: '/create',
            templateUrl: 'creditCards/templates/creditCardCreate.tpl.html',
            controller: 'CreditCardCreateCtrl',
            controllerAs: 'creditCardCreate'
        })
        .state('creditCards.assign', {
            templateUrl: 'creditCards/templates/creditCardAssign.tpl.html',
            controller: 'CreditCardAssignCtrl',
            controllerAs: 'creditCardAssign',
            //Adding 1 to query parameters to differentiate between query parameters of the parent state
            url: '/:creditcardid/assign?search1&page1&pageSize1&searchOn1&sortBy1&filters1',
            resolve: {
                Buyer: function(OrderCloud) {
                    return OrderCloud.Buyers.Get();
                },
                AssignedUserGroups: function($stateParams, OrderCloud) {
                    return OrderCloud.CreditCards.ListAssignments($stateParams.creditcardid);
                },
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams, 1);
                },
                SelectedCreditCard: function($stateParams, OrderCloud) {
                    return OrderCloud.CreditCards.Get($stateParams.creditcardid);
                },
                UserGroupList: function(OrderCloud, Parameters) {
                    return OrderCloud.UserGroups.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
    ;
}

function CreditCardsController($state, $ocMedia, OrderCloud, OrderCloudParameters, CreditCardList, Parameters) {
    var vm = this;
    vm.list = CreditCardList;
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
        return OrderCloud.CreditCards.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize ||  vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function creditCardExpirationDate() {
    //return the expirationMonth array and its function
    var expirationDate={
        expirationMonth : [{number:1,string:'01'}, {number:2,string:'02'}, {number:3,string:'03'}, {number:4,string:'04'}, {number:5,string:'05'}, {number:6,string:'06'}, {number:7,string:'07'}, {number:8,string:'08'}, {number:9,string:'09'}, {number:10,string:'10'}, {number:11,string:'11'}, {number:12,string:'12'}],
        expirationYear : [],
        isLeapYear : function leapYear(year) {
                return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
            }
    };

    function _ccExpireYears() {
        var today = new Date();
        today = today.getFullYear();

        for(var x=today; x < today+21; x++) {
            expirationDate.expirationYear.push(x);
        }
        return expirationDate.expirationYear;
    }
    _ccExpireYears();
    return expirationDate;
}

function CreditCardEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedCreditCard, creditCardExpirationDate) {
    var vm = this,
        creditcardid = SelectedCreditCard.ID;
    vm.expireMonth = creditCardExpirationDate.expirationMonth;
    vm.expireYear =creditCardExpirationDate.expirationYear;
    vm.creditCardName = SelectedCreditCard.ID;
    vm.creditCard = SelectedCreditCard;

    if (vm.creditCard.ExpirationDate != null) {
        vm.creditCard.ExpirationDate = new Date(vm.creditCard.ExpirationDate);
        vm.creditCard.selectedExpireMonth = _.findWhere(vm.expireMonth, {number: vm.creditCard.ExpirationDate.getMonth() +1});
        vm.creditCard.selectedExpireYear = vm.expireYear[vm.expireYear.indexOf(vm.creditCard.ExpirationDate.getFullYear())];
    }
   
    vm.creditCard.Token = 'token';

    vm.Submit = function() {
        var expiration = new Date();
        //If the expiration date field is left blank, selectedExpireMonth will be undefined, so we don't want it to error 
        if (vm.creditCard.selectedExpireMonth != undefined) {
            var monthNum = vm.creditCard.selectedExpireMonth.number;
            var leapYear = creditCardExpirationDate.isLeapYear(vm.creditCard.selectedExpireYear);
            //Pushes the date back to the last day of the previous month
            //Special case for February, always set back one more day to avoid leap year problems
            monthNum == 2 ? expiration.setMonth(monthNum,-1): expiration.setMonth(monthNum,0);
            if (leapYear === true && monthNum === 2) {
                expiration.setDate(29);
            }
        } else {
            expiration.setMonth(undefined);
        }
        expiration.setYear(vm.creditCard.selectedExpireYear);
        vm.creditCard.ExpirationDate = expiration;
        OrderCloud.CreditCards.Update(creditcardid, vm.creditCard)
            .then(function() {
                $state.go('creditCards', {}, {reload: true});
                toastr.success('Credit Card Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.Delete = function() {
        OrderCloud.CreditCards.Delete(SelectedCreditCard.ID)
            .then(function() {
                $state.go('creditCards', {}, {reload: true});
                toastr.success('Credit Card Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CreditCardCreateController($exceptionHandler, $state, toastr, OrderCloud, creditCardExpirationDate) {
    var vm = this;
    vm.expireMonth = creditCardExpirationDate.expirationMonth;
    vm.expireYear = creditCardExpirationDate.expirationYear;
    vm.creditCard = {};
    //TODO: stop faking the token
    vm.creditCard.Token = 'token';

    vm.Submit= function() {
        var expiration = new Date();
        //If the expiration date field is left blank, selectedExpireMonth will be undefined, so we don't want it to error 
        if (vm.selectedExpireMonth != undefined) {
            var monthNum = vm.selectedExpireMonth.number;
            var leapYear = creditCardExpirationDate.isLeapYear(vm.selectedExpireYear);
            //Pushes the date back to the last day of the previous month
            //Special case for February, always set back one more day to avoid leap year problems
            monthNum == 2 ? expiration.setMonth(monthNum,-1): expiration.setMonth(monthNum,0);
            if (leapYear === true && monthNum === 2) {
                expiration.setDate(29);
            }
        } else {
            expiration.setMonth(undefined);
        }
        expiration.setYear(vm.selectedExpireYear);
        vm.creditCard.ExpirationDate = expiration;
        OrderCloud.CreditCards.Create(vm.creditCard)
            .then(function() {
                $state.go('creditCards', {}, {reload: true});
                toastr.success('Credit Card Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

}

function CreditCardAssignController($scope, $state, $ocMedia, toastr, OrderCloud, Assignments, Paging, OrderCloudParameters, Buyer, UserGroupList, AssignedUserGroups, SelectedCreditCard, Parameters) {
    var vm = this;
    vm.buyer = Buyer;
    vm.assignBuyer = false;
    vm.list = UserGroupList;
    vm.assignments = AssignedUserGroups;
    vm.creditCard = SelectedCreditCard;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;
    vm.saveAssignments = SaveAssignments;
    vm.pagingfunction = PagingFunction;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserGroupID');
    });

    function SaveFunc(ItemID) {
        return OrderCloud.CreditCards.SaveAssignment({
            CreditCardID: vm.creditCard.ID,
            UserID: null,
            UserGroupID: ItemID
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloud.CreditCards.DeleteAssignment(vm.creditCard.ID, null, ItemID);
    }

    function SaveAssignments() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'UserGroupID');
    }

    function AssignFunc() {
        return OrderCloud.CreditCards.ListAssignments(vm.creditCard.ID, null, null, null, vm.assignments.Meta.Page + 1, vm.assignments.Meta.PageSize);
    }

    function PagingFunction() {
        return Paging.Paging(vm.list, 'UserGroups', vm.assignments, AssignFunc);
    }

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage, 1));
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
        $state.go('.', {page1:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.UserGroups.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize ||  vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}
