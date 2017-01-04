angular.module('orderCloud')
    .config(UsersConfig)
    .controller('UsersCtrl', UsersController)
    .controller('UserEditCtrl', UserEditController)
    .controller('UserCreateCtrl', UserCreateController)
;

function UsersConfig($stateProvider) {
    $stateProvider
        .state('users', {
            parent: 'base',
            templateUrl: 'users/templates/users.tpl.html',
            controller: 'UsersCtrl',
            controllerAs: 'users',
            url: '/users?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Users'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserList: function(OrderCloud, Parameters) {
                    return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('users.edit', {
            url: '/:userid/edit',
            templateUrl: 'users/templates/userEdit.tpl.html',
            controller: 'UserEditCtrl',
            controllerAs: 'userEdit',
            resolve: {
                SelectedUser: function($stateParams, OrderCloud) {
                    return OrderCloud.Users.Get($stateParams.userid);
                }
            }
        })
        .state('users.create', {
            url: '/create',
            params: {
                fromRoute: null,
                buyerid: null
            },
            templateUrl: 'users/templates/userCreate.tpl.html',
            controller: 'UserCreateCtrl',
            controllerAs: 'userCreate',
            resolve: {
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                }
            }
        })
    ;
}

function UsersController($state, $ocMedia, OrderCloud, OrderCloudParameters, UserList, Parameters) {
    var vm = this;
    vm.list = UserList;
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
        return OrderCloud.Users.List(Parameters.userGroupID, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function UserEditController($exceptionHandler, $state, toastr, OrderCloud, SelectedUser) {
    var vm = this,
        userid = SelectedUser.ID;
    vm.userName = SelectedUser.Username;
    vm.user = SelectedUser;
    if (vm.user.TermsAccepted != null) {
        vm.TermsAccepted = true;
    }

    vm.Submit = function() {
        var today = new Date();
        vm.user.TermsAccepted = today;
        OrderCloud.Users.Update(userid, vm.user)
            .then(function() {
                $state.go('users', {}, {reload: true});
                toastr.success('User Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.Users.Delete(userid)
            .then(function() {
                $state.go('users', {}, {reload: true});
                toastr.success('User Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function UserCreateController($exceptionHandler, $state, toastr, OrderCloud, Parameters) {
    var vm = this;
    vm.user = {Email: '', Password: ''};
    vm.user.Active = false;
    vm.Submit = function() {
        vm.user.TermsAccepted = new Date();
        OrderCloud.Users.Create(vm.user)
            .then(function() {
                if(Parameters.fromRoute == "buyerDetails") {
                    $state.go('buyers.details', {buyerid: Parameters.buyerid}, {reload: true});
                    toastr.success('User Created', 'Success');
                } else {
                    $state.go('users', {}, {reload: true});
                    toastr.success('User Created', 'Success');
                }
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });

    };
}