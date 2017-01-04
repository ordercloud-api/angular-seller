angular.module('orderCloud')
    .config(OrdersConfig)
    .controller('OrdersCtrl', OrdersController)
    .controller('OrdersDetailCtrl', OrdersDetailController)
    .controller('OrdersDetailLineItemCtrl', OrdersDetailLineItemController)
    .factory('OrdersFactory', OrdersFactory)
    .filter('paymentmethods', paymentmethods)
;

function OrdersConfig($stateProvider) {
    $stateProvider
        .state('orders', {
            parent: 'base',
            templateUrl: 'orders/templates/orders.tpl.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders',
            url: '/orders?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Orders'},
            resolve: {
                UserType: function(OrderCloud) {
                    return JSON.parse(atob(OrderCloud.Auth.ReadToken().split('.')[1])).usrtype;
                },
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                OrderList: function(OrderCloud, Parameters, UserType) {
                    return OrderCloud.Orders[UserType == 'admin' ? 'ListIncoming' : 'ListOutgoing'](Parameters.from, Parameters.to, Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('orders.detail', {
            url: '/:orderid',
            templateUrl: 'orders/templates/orders.detail.tpl.html',
            controller: 'OrdersDetailCtrl',
            controllerAs: 'ordersDetail',
            resolve: {
                SelectedOrder: function($stateParams, OrdersFactory) {
                    return OrdersFactory.GetOrderDetails($stateParams.orderid);
                }
            }
        })
        .state('orders.detail.lineItem', {
            url: '/:lineitemid',
            templateUrl: 'orders/templates/orders.detail.lineItem.tpl.html',
            controller: 'OrdersDetailLineItemCtrl',
            controllerAs: 'ordersDetailLineItem',
            resolve: {
                SelectedLineItem: function($stateParams, OrdersFactory) {
                    return OrdersFactory.GetLineItemDetails($stateParams.orderid, $stateParams.lineitemid);
                }
            }
        })
    ;
}

function OrdersController($state, $ocMedia, OrderCloud, OrderCloudParameters, UserType, OrderList, Parameters) {
    var vm = this;
    vm.list = OrderList;
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
        return OrderCloud.Orders[UserType == 'admin' ? 'ListIncoming' : 'ListOutgoing'](Parameters.from, Parameters.to, Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function OrdersDetailController(toastr, SelectedOrder, OrderCloud) {
    var vm = this;
    vm.order = SelectedOrder;
    vm.addToFavorites = function() {
        //TODO: Refactor when SDK allows us to patch null
        if (!SelectedOrder.xp) {
            SelectedOrder.xp = {}
        }
        SelectedOrder.xp.favorite = true;

        OrderCloud.Orders.Update(SelectedOrder.ID, SelectedOrder)
            .then(function() {
                toastr.success("Your order has been added to Favorites! You can now easily find your order in 'Order History'", 'Success');
            })
            .catch(function() {
                toastr.error('There was a problem adding this order to your Favorites', 'Error');
            });
    };

    vm.removeFromFavorites = function() {
        delete SelectedOrder.xp.favorite;
        OrderCloud.Orders.Patch(SelectedOrder.ID, {xp: null});
        toastr.success('Your order has been removed from Favorites', 'Success')
    };
}

function OrdersDetailLineItemController(SelectedLineItem) {
    var vm = this;
    vm.lineItem = SelectedLineItem;
}

function OrdersFactory($q, OrderCloud) {
    var service = {
        GetOrderDetails: _getOrderDetails,
        GetLineItemDetails: _getLineItemDetails,
        SearchOrders: _searchOrders,
        GetGroupOrders: _getGroupOrders
    };

    function _getOrderDetails(orderID) {
        var deferred = $q.defer();
        var order;
        var lineItemQueue = [];
        var productQueue = [];

        OrderCloud.Orders.Get(orderID)
            .then(function(data) {
                order = data;
                order.LineItems = [];
                gatherLineItems();
            });

        function gatherLineItems() {
            OrderCloud.LineItems.List(orderID, null, 1, 100)
                .then(function(data) {
                    order.LineItems = order.LineItems.concat(data.Items);
                    for (var i = 2; i <= data.Meta.TotalPages; i++) {
                        lineItemQueue.push(OrderCloud.LineItems.List(orderID, null, i, 100));
                    }
                    $q.all(lineItemQueue).then(function(results) {
                        angular.forEach(results, function(result) {
                            order.LineItems = order.LineItems.concat(result.Items);
                        });
                        gatherProducts();
                    });
                });
        }

        function gatherProducts() {
            var productIDs = _.uniq(_.pluck(order.LineItems, 'ProductID'));

            angular.forEach(productIDs, function(productID) {
                productQueue.push((function() {
                    var d = $q.defer();

                    OrderCloud.Products.Get(productID)
                        .then(function(product) {
                            angular.forEach(_.where(order.LineItems, {ProductID: product.ID}), function(item) {
                                item.Product = product;
                            });

                            d.resolve();
                        });

                    return d.promise;
                })());
            });

            $q.all(productQueue).then(function() {
                if (order.SpendingAccountID) {
                    OrderCloud.SpendingAccounts.Get(order.SpendingAccountID)
                        .then(function(sa) {
                            order.SpendingAccount = sa;
                            deferred.resolve(order);
                        });
                }
                else {
                    deferred.resolve(order);
                }
            });
        }

        return deferred.promise;
    }

    function _getLineItemDetails(orderID, lineItemID) {
        var deferred = $q.defer();
        var lineItem;

        OrderCloud.LineItems.Get(orderID, lineItemID)
            .then(function(li) {
                lineItem = li;
                getProduct();
            });

        function getProduct() {
            OrderCloud.Products.Get(lineItem.ProductID)
                .then(function(product) {
                    lineItem.Product = product;
                    deferred.resolve(lineItem);
                });
        }

        return deferred.promise;
    }

    function _searchOrders(filters, userType) {
        var deferred = $q.defer();

        if (!filters.groupOrders && filters.searchingGroupOrders) {
            deferred.resolve();
        } else {
            if (filters.favorite) {
                OrderCloud.Orders[userType == 'admin' ? 'ListIncoming' : 'ListOutgoing'](filters.FromDate, filters.ToDate, filters.searchTerm, 1, 100, null, filters.sortType, {ID: filters.OrderID, Status: filters.Status, FromUserID: filters.groupOrders, xp:{favorite:filters.favorite} }, filters.FromCompanyID)
                    .then(function(data) {
                        deferred.resolve(data);
                    });
            } else {
                OrderCloud.Orders[userType == 'admin' ? 'ListIncoming' : 'ListOutgoing'](filters.FromDate, filters.ToDate, filters.searchTerm, 1, 100, null, filters.sortType, {ID: filters.OrderID, Status: filters.Status, FromUserID: filters.groupOrders}, filters.FromCompanyID)
                    .then(function(data) {
                        deferred.resolve(data);
                    });
            }
        }

        return deferred.promise;
    }

    function _getGroupOrders(groupList) {
        var userIDs =[];
        var dfd = $q.defer();
        getUserIDs(groupList)
            .then(function(users) {
                angular.forEach(users, function(user) {
                    userIDs.push(user.UserID)
                });
                dfd.resolve(userIDs.join('|'));
            });
        return dfd.promise;

        function getUserIDs(groups) {
            var dfd = $q.defer();
            var queue = [];
            var userList = [];
            angular.forEach(groups, function(group) {
                queue.push(OrderCloud.UserGroups.ListUserAssignments(group));
            });

            $q.all(queue)
                .then(function(users) {
                    angular.forEach(users, function(user) {
                       userList = userList.concat(user.Items);
                    });

                    dfd.resolve(userList);
                });

           return dfd.promise;
        }
    }

    return service;
}

function paymentmethods() {
    var map = {
        'PurchaseOrder': 'Purchase Order',
        'CreditCard': 'CreditCard',
        'SpendingAccount': 'Spending Account',
        'PayPalExpressCheckout': 'PayPal Express Checkout'
    };
    return function(method) {
        if (!map[method]) return method;
        return map[method];
    }
}
