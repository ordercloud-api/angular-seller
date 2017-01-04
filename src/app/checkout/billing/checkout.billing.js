angular.module('orderCloud')
	.config(checkoutBillingConfig)
	.controller('CheckoutBillingCtrl', CheckoutBillingController)
;

function checkoutBillingConfig($stateProvider) {
	$stateProvider
		.state('checkout.billing', {
			url: '/billing',
			templateUrl: 'checkout/billing/templates/checkout.billing.tpl.html',
			controller: 'CheckoutBillingCtrl',
			controllerAs: 'checkoutBilling',
			resolve: {
				BillingAddresses: function($q, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Me.ListAddresses()
                        .then(function(data) {
                            dfd.resolve(_.where(data.Items, {Billing: true}));
                        });
                    return dfd.promise;
				}
			}
		})
}

function CheckoutBillingController($state, $exceptionHandler, OrderCloud, BillingAddresses) {
	var vm = this;
	vm.billingAddresses = BillingAddresses;
    vm.SaveBillingAddress = SaveBillingAddress;
    vm.SaveCustomAddress = SaveCustomAddress;

    function SaveBillingAddress(order) {
        if (order && order.BillingAddressID) {
            OrderCloud.Orders.Patch(order.ID, {BillingAddressID: order.BillingAddressID})
                .then(function() {
                    $state.reload();
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }

    function SaveCustomAddress(order) {
        if (vm.saveAddress) {
            OrderCloud.Addresses.Create(vm.address)
                .then(function(address) {
                    OrderCloud.Me.Get()
                        .then(function(me) {
                            OrderCloud.Addresses.SaveAssignment({
                                    AddressID: address.ID,
                                    UserID: me.ID,
                                    IsBilling: true,
                                    IsShipping: false
                                })
                                .then(function() {
                                    OrderCloud.Orders.Patch(order.ID, {BillingAddressID: vm.address.ID})
                                        .then(function() {
                                            $state.reload();
                                        })
                                        .catch(function(ex) {
                                            $exceptionHandler(ex);
                                        });
                                })
                                .catch(function(ex) {
                                    $exceptionHandler(ex);
                                });
                        })
                        .catch(function(ex) {
                            $exceptionHandler(ex);
                        });
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
        else {
            OrderCloud.Orders.Patch(order.ID, {BillingAddressID: vm.address})
                .then(function() {
                    $state.reload();
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }
}