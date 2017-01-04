angular.module('orderCloud')
	.config(checkoutConfig)
	.controller('CheckoutCtrl', CheckoutController)
	.factory('CheckoutService', CheckoutService)
	.controller('OrderReviewCtrl', OrderReviewController)
	.controller('OrderConfirmationCtrl', OrderConfirmationController)
    .directive('ordercloudCheckoutLineitems', CheckoutLineItemsListDirective)
    .directive('ordercloudConfirmationLineitems', ConfirmationLineItemsListDirective)
    .controller('CheckoutLineItemsCtrl', CheckoutLineItemsController)
    .controller('ConfirmationLineItemsCtrl', ConfirmationLineItemsController)
    //.factory('TaxService', TaxService)
    //toggle isMultipleAddressShipping if you do not wish to allow line items to ship to multiple addresses
    .constant('isMultipleAddressShipping', true)
;

function checkoutConfig($stateProvider) {
	$stateProvider
		.state('checkout', {
			parent: 'base',
            data: {componentName: 'Checkout'},
			url: '/checkout',
			templateUrl: 'checkout/templates/checkout.tpl.html',
			controller: 'CheckoutCtrl',
			controllerAs: 'checkout',
			resolve: {
                Order: function($rootScope, $q, $state, toastr, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function(order) {
                            dfd.resolve(order)
                        })
                        .catch(function() {
                            toastr.error('You do not have an active open order.', 'Error');
                            if ($state.current.name.indexOf('checkout') > -1) {
                                $state.go('home');
                            }
                            dfd.reject();
                        });
                    return dfd.promise;
                },
                OrderShipAddress: function($q, OrderShippingAddress) {
                    var dfd = $q.defer();
                    OrderShippingAddress.Get()
                        .then(function(data) {
                            dfd.resolve(data);
                        })
                        .catch(function() {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                },
                ShippingAddresses: function($q, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Me.ListAddresses()
                        .then(function(data) {
                            dfd.resolve(_.where(data.Items, {Shipping: true}));
                        });
                    return dfd.promise;
                },
                OrderPayments: function($q, OrderCloud, Order) {
                    var deferred = $q.defer();

                    OrderCloud.Payments.List(Order.ID)
                        .then(function(data) {
                            if (!data.Items.length) {
                                OrderCloud.Payments.Create(Order.ID, {})
                                    .then(function(p) {
                                        deferred.resolve({Items: [p]});
                                    });
                            }
                            else {
                                deferred.resolve(data);
                            }
                        });

                    return deferred.promise;
                }
			}
		})
        .state('checkout.confirmation', {
            url: '/confirmation',
            views: {
                '@base': {
                    templateUrl: 'checkout/templates/confirmation.tpl.html',
                    controller: 'OrderConfirmationCtrl',
                    controllerAs: 'orderConfirmation'
                }
            }
        })
		.state('orderReview', {
            parent: 'base',
			url: '/order/:orderid/review',
            templateUrl: 'checkout/templates/review.tpl.html',
            controller: 'OrderReviewCtrl',
            controllerAs: 'orderReview',
            resolve: {
                SubmittedOrder: function($q, $stateParams, $state, toastr, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Orders.Get($stateParams.orderid)
                        .then(function(order) {
                            if (order.Status == 'Unsubmitted') {
                                $state.go('checkout.shipping')
                                    .then(function() {
                                        toastr.error('You cannot review an Unsubmitted Order', 'Error');
                                        dfd.reject();
                                    });
                            }
                            else dfd.resolve(order);
                        });
                    return dfd.promise;
                }
			}
		})
    ;
}

function CheckoutService() {
    var lineItems = [];
    return {
        StoreLineItems: _storeLineItems,
        GetLineItems: _getLineItems
    };

    function _storeLineItems(items) {
        lineItems = items;
    }

    function _getLineItems() {
        return lineItems;
    }
}

function CheckoutController($state, $rootScope, toastr, OrderCloud, CheckoutService, Order, ShippingAddresses, OrderShipAddress, OrderShippingAddress, OrderPayments) {
    var vm = this;
    vm.currentOrder = Order;
    vm.currentOrder.ShippingAddressID =  null;
    vm.currentOrder.ShippingAddress = OrderShipAddress;
    vm.shippingAddresses = ShippingAddresses;
    vm.isMultipleAddressShipping = true;
    vm.currentOrderPayments = OrderPayments.Items;

    vm.orderIsValid = function() {
        var orderPaymentsTotal = 0;
        var validPaymentMethods = false;
        angular.forEach(vm.currentOrderPayments, function(payment) {
            orderPaymentsTotal += payment.Amount;
            if ((payment.Type == 'SpendingAccount' && payment.SpendingAccountID != null) || (payment.Type == 'CreditCard' && payment.CreditCardID != null) || payment.Type == 'PurchaseOrder') {
                validPaymentMethods = true;
            }
            else {
                validPaymentMethods = false;
            }
        });
        if (orderPaymentsTotal === vm.currentOrder.Subtotal && validPaymentMethods && vm.currentOrder.BillingAddress && vm.currentOrder.BillingAddress.ID != null) {
            return true;
        }
        else {
            return false;
        }
    };

    // default state (if someone navigates to checkout -> checkout.shipping)
    if ($state.current.name === 'checkout') {
        $state.transitionTo('checkout.shipping');
    }

    $rootScope.$on('OrderShippingAddressChanged', function(event, order, address) {
        vm.currentOrder = order;
        vm.currentOrder.ShippingAddressID = address.ID;
        vm.currentOrder.ShippingAddress = address;
    });

    $rootScope.$on('OC:UpdateOrder', function(event, OrderID) {
        OrderCloud.Orders.Get(OrderID)
            .then(function(data) {
                vm.currentOrder.Subtotal = data.Subtotal;
            });
    });

    $rootScope.$on('LineItemAddressUpdated', function() {
        vm.currentOrder.ShippingAddress = null;
        vm.currentOrder.ShippingAddressID = null;
        OrderShippingAddress.Clear();
    });

    vm.checkShippingAddresses = function() {
        var lineItems = CheckoutService.GetLineItems();
        var orderValid = true;
        angular.forEach(lineItems, function(li) {
            var itemValid = false;
            if (li.ShippingAddressID) {
                itemValid = true;
            }
            else if (li.ShippingAddress && li.ShippingAddress.Street1) {
                itemValid = true;
            }
            if (!itemValid) orderValid = false;
        });
        if (orderValid) {
            $state.go('checkout.confirmation');
        }
        else {
            toastr.error('Please select a shipping address for all line items');
        }
    };
}

function OrderConfirmationController($rootScope, $state, toastr, OrderCloud, Order, CurrentOrder, isMultipleAddressShipping, OrderPayments) {
    var vm = this;

    vm.currentOrder = Order;
    vm.isMultipleAddressShipping = isMultipleAddressShipping;
    vm.orderPayments = OrderPayments.Items;

    angular.forEach(vm.orderPayments, function(payment, index) {
        if (payment.Type === 'CreditCard' && payment.CreditCardID) {
            OrderCloud.CreditCards.Get(payment.CreditCardID)
                .then(function(cc) {
                    vm.orderPayments[index].creditCardDetails = cc;
                })
                .catch(function(ex) {
                    toastr.error(ex, 'Error');
                });
        }
        if (payment.Type === 'SpendingAccount' && payment.SpendingAccountID) {
            OrderCloud.SpendingAccounts.Get(payment.SpendingAccountID)
                .then(function(sa) {
                    vm.orderPayments[index].spendingAccountDetails = sa;
                })
                .catch(function(ex) {
                    toastr.error(ex, 'Error');
                });
        }
    });

    vm.submitOrder = function() {
        OrderCloud.Orders.Submit(vm.currentOrder.ID)
            .then(function(order) {
                CurrentOrder.Remove()
                    .then(function() {
                        $state.go('orderReview', {orderid: order.ID});
                        toastr.success('Your order has been submitted', 'Success');
                        $rootScope.$broadcast('OC:RemoveOrder');
                    })
            })
            .catch(function(ex) {
                toastr.error('Your order did not submit successfully.', 'Error');
            });
    };
}

function OrderReviewController($q, toastr, OrderCloud, LineItemHelpers, SubmittedOrder, isMultipleAddressShipping) {
	var vm = this;
    vm.submittedOrder = SubmittedOrder;
    vm.isMultipleAddressShipping = isMultipleAddressShipping;

    OrderCloud.Payments.List(vm.submittedOrder.ID)
        .then(function(data) {
            vm.orderPayments = data.Items;
        })
        .then(function() {
            angular.forEach(vm.orderPayments, function(payment, index) {
                if (payment.Type === 'CreditCard' && payment.CreditCardID) {
                    OrderCloud.CreditCards.Get(payment.CreditCardID)
                        .then(function(cc) {
                            vm.orderPayments[index].creditCardDetails = cc;
                        })
                        .catch(function(ex) {
                            toastr.error(ex, 'Error');
                        })
                }
                if (payment.Type === 'SpendingAccount' && payment.SpendingAccountID) {
                    OrderCloud.SpendingAccounts.Get(payment.SpendingAccountID)
                        .then(function(sa) {
                            vm.orderPayments[index].spendingAccountDetails = sa;
                        })
                        .catch(function(ex) {
                            toastr.error(ex, 'Error');
                        })
                }
            });
        });

    var dfd = $q.defer();
    var queue = [];
    OrderCloud.LineItems.List(vm.submittedOrder.ID)
        .then(function(li) {
            vm.LineItems = li;
            if (li.Meta.TotalPages > li.Meta.Page) {
                var page = li.Meta.Page;
                while (page < li.Meta.TotalPages) {
                    page += 1;
                    queue.push(OrderCloud.LineItems.List(vm.submittedOrder.ID, page));
                }
            }
            $q.all(queue)
                .then(function(results) {
                    angular.forEach(results, function(result) {
                        vm.LineItems.Items = [].concat(vm.LineItems.Items, result.Items);
                        vm.LineItems.Meta = result.Meta;
                    });
                    dfd.resolve(LineItemHelpers.GetProductInfo(vm.LineItems.Items.reverse()));
                });
        });

    vm.print = function() {
        window.print();
    };

    vm.addToFavorites = function() {
        //TODO: Refactor when SDK allows us to patch null
        if (!SubmittedOrder.xp) {
            SubmittedOrder.xp ={}
        }
        SubmittedOrder.xp.favorite = true;

        OrderCloud.Orders.Update(SubmittedOrder.ID, SubmittedOrder)
            .then(function() {
                toastr.success("Your order has been added to Favorites! You can now easily find your order in 'Order History'", 'Success')
            })
            .catch(function() {
                toastr.error('There was a problem adding this order to your Favorites', 'Error');
            });
    };

    vm.removeFromFavorites = function() {
        delete SubmittedOrder.xp.favorite;
        OrderCloud.Orders.Patch(SubmittedOrder.ID, {xp: null});
        toastr.success('Your order has been removed from Favorites', 'Success')
    };
}

function CheckoutLineItemsListDirective() {
    return {
        scope: {
            order: '=',
            addresses: '='
        },
        templateUrl: 'checkout/templates/checkout.lineitems.tpl.html',
        controller: 'CheckoutLineItemsCtrl',
        controllerAs: 'checkoutLI'
    };
}

function CheckoutLineItemsController($rootScope, $scope, $q, toastr, OrderCloud, LineItemHelpers, CheckoutService, CurrentOrder) {
    var vm = this;
    vm.lineItems = {};
    vm.UpdateQuantity = LineItemHelpers.UpdateQuantity;
    vm.UpdateShipping = LineItemHelpers.UpdateShipping;
    vm.setCustomShipping = LineItemHelpers.CustomShipping;
    vm.RemoveItem = LineItemHelpers.RemoveItem;
    //vm.calculatingTax = false;

    $scope.$on('LineItemAddressUpdated', function(event, LineItemID, address) {
        //vm.calculatingTax = true;
        _.where(vm.lineItems.Items, {ID: LineItemID})[0].ShippingAddress = address;
        //TaxService.Calculate($scope.order.ID)
        //    .then(function(taxData) {
        //        if (taxData.calculatedTaxSummary) {
        //            vm.taxInformation = taxData.calculatedTaxSummary.totalTax;
        //            CurrentOrder.Get()
        //                .then(function(order) {
        //                    order.xp = {taxInfo: vm.taxInformation};
        //                    OrderCloud.Orders.Update(order.ID, order);
        //                })
        //        }
        //        else{
        //            toastr.error('The provided address is not valid', 'Error');
        //            vm.calculatingTax = false;
        //            vm.taxInformation = 0;
        //            CurrentOrder.Get()
        //                .then(function(order) {
        //                    order.xp = {taxInfo: vm.taxInformation};
        //                    OrderCloud.Orders.Update(order.ID, order);
        //                })
        //        }
        //
        //})
    });

    $scope.$on('OrderShippingAddressChanged', function(event, order, address) {
        //vm.calculatingTax = true;
        angular.forEach(vm.lineItems.Items, function(li) {
            li.ShippingAddressID = address.ID;
            li.ShippingAddress = address;
        //    TaxService.Calculate($scope.order.ID)
        //        .then(function(taxData) {
        //            if (taxData.calculatedTaxSummary) {
        //                vm.taxInformation = taxData.calculatedTaxSummary.totalTax;
        //                CurrentOrder.Get()
        //                    .then(function(order) {
        //                        order.xp = {taxInfo: vm.taxInformation};
        //                        OrderCloud.Orders.Update(order.ID, order);
        //                    })
        //            }
        //            else{
        //                toastr.error('The provided address is not valid', 'Error');
        //                vm.calculatingTax = false;
        //                vm.taxInformation = 0;
        //                CurrentOrder.Get()
        //                    .then(function(order) {
        //                        order.xp = {taxInfo: vm.taxInformation};
        //                        OrderCloud.Orders.Update(order.ID, order);
        //                    })
        //            }
        //        })
        });
    });

    $scope.$watch(function() {
        return $scope.order.ID;
    }, function() {
        LineItemsInit($scope.order.ID)
    });

    function LineItemsInit(OrderID) {
        OrderCloud.LineItems.List(OrderID)
            .then(function(data) {
                vm.lineItems = data;
                LineItemHelpers.GetProductInfo(vm.lineItems.Items);
                CheckoutService.StoreLineItems(vm.lineItems.Items);
            });
    }

    vm.pagingfunction = function() {
        if (vm.lineItems.Meta.Page < vm.lineItems.Meta.TotalPages) {
            var dfd = $q.defer();
            OrderCloud.LineItems.List($scope.order.ID, vm.lineItems.Meta.Page + 1, vm.lineItems.Meta.PageSize)
                .then(function(data) {
                    vm.lineItems.Meta = data.Meta;
                    vm.lineItems.Items = [].concat(vm.lineItems.Items, data.Items);
                    LineItemHelpers.GetProductInfo(vm.lineItems.Items);
                    CheckoutService.StoreLineItems(vm.lineItems.Items);
                });
            return dfd.promise;
        }
        else return null;
    };
}
//function TaxService($http, OrderCloud, $exceptionHandler) {
//    return {Calculate: Calculate};
//    function Calculate(OrderID) {
//        var requestObject = {
//            orderID: OrderID,
//            accessToken: OrderCloud.Auth.ReadToken(),
//            buyerID: OrderCloud.BuyerID.Get()
//        };
//        return $http.post('https://Four51TRIAL104401.jitterbit.net/Four51OnPrem/v1/CalculateTax', requestObject).then(function(taxInfo) {
//            return taxInfo.data;
//        }).catch(function(err) {
//            $exceptionHandler(err);
//        });
//    }
//}

function ConfirmationLineItemsListDirective() {
    return {
        scope: {
            order: '='
        },
        templateUrl: 'checkout/templates/confirmation.lineitems.tpl.html',
        controller: 'ConfirmationLineItemsCtrl',
        controllerAs: 'confirmationLI'
    };
}

function ConfirmationLineItemsController($scope, $q, OrderCloud, LineItemHelpers, isMultipleAddressShipping) {
    var vm = this;
    vm.lineItems = {};
    vm.isMultipleAddressShipping = isMultipleAddressShipping;

    $scope.$watch(function() {
        return $scope.order.ID;
    }, function() {
        OrderCloud.LineItems.List($scope.order.ID)
            .then(function(data) {
                vm.lineItems = data;
                LineItemHelpers.GetProductInfo(vm.lineItems.Items);
            });
    });

    vm.pagingfunction = function() {
        if (vm.lineItems.Meta.Page < vm.lineItems.Meta.TotalPages) {
            var dfd = $q.defer();
            OrderCloud.LineItems.List($scope.order.ID, vm.lineItems.Meta.Page + 1, vm.lineItems.Meta.PageSize)
                .then(function(data) {
                    vm.lineItems.Meta = data.Meta;
                    vm.lineItems.Items = [].concat(vm.lineItems.Items, data.Items);
                    LineItemHelpers.GetProductInfo(vm.lineItems.Items);
                });
            return dfd.promise;
        }
        else return null;
    };
}
