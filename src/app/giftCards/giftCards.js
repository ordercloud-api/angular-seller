angular.module('orderCloud')
    .config (GiftCardsConfig)
    .controller('GiftCardsCtrl', GiftCardsController)
    .controller('GiftCardCreateCtrl', GiftCardCreateController)
    .controller('GiftCardEditCtrl', GiftCardEditController)
    .controller('GiftCardAssignGroupCtrl', GiftCardAssignGroupController)
    .controller('GiftCardAssignUserCtrl', GiftCardAssignUserController)
    .factory('GiftCardFactory', GiftCardFactory)
;

function GiftCardsConfig($stateProvider) {
    $stateProvider
        .state('giftCards', {
            parent: 'base',
            templateUrl: 'giftCards/templates/giftCards.tpl.html',
            controller: 'GiftCardsCtrl',
            controllerAs: 'giftCards',
            url: '/giftcards?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Gift Cards'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                GiftCardList: function(OrderCloud, Parameters) {
                    var parameters = angular.copy(Parameters);
                    parameters.filters ? parameters.filters.RedemptionCode = '*': parameters.filters = {RedemptionCode :'*'};
                    return OrderCloud.SpendingAccounts.List(parameters.search, parameters.page, parameters.pageSize || 12, parameters.searchOn, parameters.sortBy, parameters.filters);
                }
            }
        })
        .state('giftCards.edit', {
            url: '/:giftcardid/edit',
            templateUrl: 'giftCards/templates/giftCardEdit.tpl.html',
            controller: 'GiftCardEditCtrl',
            controllerAs: 'giftCardEdit',
            resolve: {
                SelectedGiftCard: function($q, $stateParams, OrderCloud) {
                    var d = $q.defer();
                    OrderCloud.SpendingAccounts.Get($stateParams.giftcardid)
                        .then(function(giftcard) {
                            if (giftcard.StartDate != null)
                                giftcard.StartDate = new Date(giftcard.StartDate);
                            if (giftcard.EndDate != null)
                                giftcard.EndDate = new Date(giftcard.EndDate);
                            d.resolve(giftcard);
                        });
                
                    return d.promise;
                }
            }
        })
        .state('giftCards.create', {
            url: '/create',
            templateUrl: 'giftCards/templates/giftCardCreate.tpl.html',
            controller: 'GiftCardCreateCtrl',
            controllerAs: 'giftCardCreate'
        })
        .state('giftCards.assignGroup', {
            url: '/:giftcardid/assign',
            templateUrl: 'giftCards/templates/giftCardAssignGroup.tpl.html',
            controller: 'GiftCardAssignGroupCtrl',
            controllerAs: 'giftCardAssign',
            resolve: {
                UserGroupList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List();
                },
                AssignedUserGroups: function($stateParams, OrderCloud) {
                    return OrderCloud.SpendingAccounts.ListAssignments($stateParams.giftcardid, null, null, 'Group');
                },
                SelectedGiftCard: function($stateParams, OrderCloud) {
                    return OrderCloud.SpendingAccounts.Get($stateParams.giftcardid);
                }
            }
        })
        .state('giftCards.assignUser', {
            url: '/:giftcardid/assign/user',
            templateUrl: 'giftCards/templates/giftCardAssignUser.tpl.html',
            controller: 'GiftCardAssignUserCtrl',
            controllerAs: 'giftCardAssignUser',
            resolve: {
                UserList: function(OrderCloud) {
                    return OrderCloud.Users.List();
                },
                AssignedUsers: function($stateParams, OrderCloud) {
                    return OrderCloud.SpendingAccounts.ListAssignments($stateParams.giftcardid, null, null, 'User');
                },
                SelectedGiftCard: function($stateParams, OrderCloud) {
                    return OrderCloud.SpendingAccounts.Get($stateParams.giftcardid);
                }
            }
        })
    ;
}

function GiftCardsController ($state, $ocMedia, OrderCloud, OrderCloudParameters, GiftCardList, TrackSearch, Parameters) {
    var vm = this;
    vm.list = GiftCardList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    vm.pagingfunction = PagingFunction;
    vm.searchfunction = Search;
    vm.searching = function() {
        return TrackSearch.GetTerm() ? true : false;
    };

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.TotalPages) {
            OrderCloud.SpendingAccounts.List(null, vm.list.Meta.Page + 1, vm.list.Meta.PageSize, null, null, {'RedemptionCode': '*'});
        }
    }

    function Search(searchTerm) {
        return OrderCloud.SpendingAccounts.List(searchTerm, null, null, null, null, {'RedemptionCode': '*'});
    }

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
        var parameters = angular.copy(Parameters);
        parameters.filters ? parameters.filters.RedemptionCode = '*': parameters.filters = {RedemptionCode :'*'};
        return OrderCloud.SpendingAccounts.List(parameters.search, vm.list.Meta.Page + 1, parameters.pageSize ||  vm.list.Meta.PageSize, parameters.searchOn, parameters.sortBy, parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function GiftCardEditController($state, $exceptionHandler, toastr, OrderCloud, GiftCardFactory, SelectedGiftCard) {
    var vm = this,
        giftCardID = SelectedGiftCard.ID;
    vm.format = GiftCardFactory.dateFormat;
    vm.open1 = vm.open2 = false;
    vm.giftCard = SelectedGiftCard;
    vm.Submit = Submit;
    vm.Delete = Delete;
    vm.giftCard.AllowAsPaymentMethod = true;

    function Submit() {
        OrderCloud.SpendingAccounts.Update(giftCardID, vm.giftCard)
            .then(function() {
                $state.go('giftCards', {}, {reload: true});
                toastr.success('Gift Card Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function Delete() {
        OrderCloud.SpendingAccounts.Delete(giftCardID)
            .then(function() {
                $state.go('giftCards', {}, {reload: true});
                toastr.success('Gift Card Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }
}

function GiftCardCreateController($state, $exceptionHandler, toastr, OrderCloud, GiftCardFactory) {
    var vm = this;
    vm.format = GiftCardFactory.dateFormat;
    vm.open1 = vm.open2 = false;
    vm.Submit = Submit;
    vm.autoGen = GiftCardFactory.autoGenDefault;
    vm.createCode = GiftCardFactory.makeCode;
    vm.giftCard = {};
    vm.giftCard.AllowAsPaymentMethod = true;

    function Submit() {
        OrderCloud.SpendingAccounts.Create(vm.giftCard)
            .then(function() {
                $state.go('giftCards', {}, {reload: true});
                toastr.success('Gift Card Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }
}

function GiftCardAssignGroupController($scope, $q, toastr, OrderCloud, Paging, Assignments, UserGroupList, AssignedUserGroups, SelectedGiftCard) {
    var vm = this;
    vm.list = UserGroupList;
    vm.assignments = AssignedUserGroups;
    vm.giftCard = SelectedGiftCard;
    vm.saveAssignments = SaveAssignments;
    vm.pagingfunction = PagingFunction;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserGroupID');
    });

    function SaveFunc(ItemID) {
        return OrderCloud.SpendingAccounts.SaveAssignment({
            SpendingAccountID: vm.giftCard.ID,
            UserID: null,
            UserGroupID: ItemID,
            AllowExceed: false
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloud.SpendingAccounts.DeleteAssignment(vm.giftCard.ID, null, ItemID);
    }

    function SaveAssignments() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'UserGroupID');
    }

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.PageSize) {
            var queue = [];
            var dfd = $q.defer();
            queue.push(OrderCloud.UserGroups.List(null, vm.list.Meta.Page + 1, vm.list.Meta.PageSize, null, null, {'RedemptionCode': '*'}));
            if (vm.assignments.Meta.Page < vm.assignments.Meta.PageSize) {
                OrderCloud.SpendingAccounts.ListAssignments(vm.giftCard.ID, null, null, 'Group', vm.list.Meta.Page + 1, vm.list.Meta.PageSize);
            }
            $q.all(queue).then(function(results) {
                dfd.resolve();
                vm.list.Meta = results[0].Meta;
                vm.list.Items = [].concat(vm.list.Items, results[0].Items);
                if (results[1]) {
                    vm.assignments.Meta = results[1].Meta;
                    vm.assignments.Items = [].concat(vm.assignments.Items, results[1].Items);
                }
            });
        }
    }
}

function GiftCardAssignUserController($scope, $q, toastr, OrderCloud, Assignments, Paging, UserList, AssignedUsers, SelectedGiftCard) {
    var vm = this;
    vm.list = UserList;
    vm.assignments = AssignedUsers;
    vm.giftCard = SelectedGiftCard;
    vm.saveAssignments = SaveAssignments;
    vm.pagingfunction = PagingFunction;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserID');
    });

    function SaveFunc(ItemID) {
        return OrderCloud.SpendingAccounts.SaveAssignment({
            SpendingAccountID: vm.giftCard.ID,
            UserID: ItemID,
            UserGroupID: null,
            AllowExceed: false
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloud.SpendingAccounts.DeleteAssignment(vm.giftCard.ID, ItemID, null);
    }

    function SaveAssignments() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'UserID');
    }

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.PageSize) {
            var queue = [];
            var dfd = $q.defer();
            queue.push(OrderCloud.Users.List(null, null, vm.list.Meta.Page + 1, vm.list.Meta.PageSize, null, null, {'RedemptionCode': '*'}));
            if (vm.assignments.Meta.Page < vm.assignments.Meta.PageSize) {
                OrderCloud.SpendingAccounts.ListAssignments(vm.giftCard.ID, null, null, 'User', vm.list.Meta.Page + 1, vm.list.Meta.PageSize);
            }
            $q.all(queue).then(function(results) {
                dfd.resolve();
                vm.list.Meta = results[0].Meta;
                vm.list.Items = [].concat(vm.list.Items, results[0].Items);
                if (results[1]) {
                    vm.assignments.Meta = results[1].Meta;
                    vm.assignments.Items = [].concat(vm.assignments.Items, results[1].Items);
                }
            });
        }
    }
}

function GiftCardFactory() {
    return {
        dateFormat: 'MM/dd/yyyy',
        autoGenDefault: true,
        makeCode: function(bits) {
            bits = typeof  bits !== 'undefined' ? bits : 16;
            var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            var code = '';
            for (var i = 0; i < bits; i += 1) {
                code += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return code;
        }
    }
}
