angular.module('orderCloud')
	.config(checkoutPaymentConfig)
	.controller('CheckoutPaymentCtrl', CheckoutPaymentController)
	.directive('ocCheckoutPayment', OCCheckoutPayment)
    //toggle allowMultiplePayments if you do not wish to allow multiple payments on the same order
    .constant('allowMultiplePayments', true)
;

function checkoutPaymentConfig($stateProvider) {
	$stateProvider
		.state('checkout.payment', {
			url: '/payment',
			templateUrl: 'checkout/payment/templates/checkout.payment.tpl.html',
			controller: 'CheckoutPaymentCtrl',
			controllerAs: 'checkoutPayment',
			resolve: {
                AvailableCreditCards: function(OrderCloud) {
                    return OrderCloud.Me.ListCreditCards();
                },
                AvailableSpendingAccounts: function(OrderCloud) {
                    // TODO: Needs to be refactored to work with Me Service
                    return OrderCloud.SpendingAccounts.List(null, null, null, null, null, {'RedemptionCode': '!*'});
                }
			}
		})
    ;
}

function CheckoutPaymentController($state, toastr, OrderCloud, AvailableCreditCards, AvailableSpendingAccounts, OrderPayments, allowMultiplePayments, creditCardExpirationDate) {
	var vm = this;
    vm.allowMultiplePayments = allowMultiplePayments;
    vm.currentOrderPayments = OrderPayments.Items;
    vm.paymentMethods = [
        {Display: 'Purchase Order', Value: 'PurchaseOrder'},
        {Display: 'Credit Card', Value: 'CreditCard'},
        {Display: 'Spending Account', Value: 'SpendingAccount'}//,
        //{Display: 'Pay Pal Express Checkout', Value: 'PayPalExpressCheckout'}
    ];
    vm.CreditCardTypes = [
        'MasterCard',
        'American Express',
        'Discover',
        'Visa'
    ];
    vm.today = new Date();
    vm.creditCards = AvailableCreditCards.Items;
    vm.spendingAccounts = AvailableSpendingAccounts.Items;
    vm.months =['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    vm.years = _.range(vm.today.getFullYear(), vm.today.getFullYear() + 20, 1);
    vm.expireMonth = creditCardExpirationDate.expirationMonth;
    vm.expireYear = creditCardExpirationDate.expirationYear;

    vm.setCreditCard = SetCreditCard;
    vm.saveCreditCard = SaveCreditCard;
    vm.setSpendingAccount = SetSpendingAccount;
    vm.setPaymentMethod = SetPaymentMethod;
    vm.createPayment = CreatePayment;
    vm.removePayment = RemovePayment;
    vm.canAddPayment = CanAddPayment;
    vm.patchPaymentAmount = PatchPaymentAmount;
    vm.setAmountMax = SetAmountMax;
    vm.savePONumber = SavePONumber;
    vm.expirationDateChange = ExpirationDateChange;

    function CreatePayment(order) {
        OrderCloud.Payments.Create(order.ID, {Type: vm.currentOrderPayments[0].Type})
            .then(function() {
                $state.reload();
            });
    }

    function RemovePayment(order, index) {
        OrderCloud.Payments.Delete(order.ID, vm.currentOrderPayments[index].ID)
            .then(function() {
                $state.reload();
            });
    }

    function SetPaymentMethod(order, index) {
        if (!vm.currentOrderPayments[0].Amount) {
            // When Order Payment Method is changed it will clear out all saved payment information
            OrderCloud.Payments.Create(order.ID, {Type: vm.currentOrderPayments[index].Type})
                .then(function() {
                    $state.reload();
                });
        }
        else {
            OrderCloud.Payments.Delete(order.ID, vm.currentOrderPayments[index].ID)
                .then(function() {
                    OrderCloud.Payments.Create(order.ID, {Type: vm.currentOrderPayments[index].Type})
                        .then(function() {
                            $state.reload();
                        });
                });
        }
    }

    function SaveCreditCard(order, card, index) {
        // TODO: Needs to save the credit card with integration plug in
        if (card) {
            // This is just until Nick gives me the integration
            vm.Token = 'cc';
            if (card.PartialAccountNumber.length === 16) {
                card.PartialAccountNumber = card.PartialAccountNumber.substr(card.PartialAccountNumber.length - 4);
                OrderCloud.CreditCards.Create(card)
                    .then(function(CreditCard) {
                        OrderCloud.Me.Get()
                            .then(function(me) {
                                OrderCloud.CreditCards.SaveAssignment({
                                        CreditCardID: CreditCard.ID,
                                        UserID: me.ID
                                    })
                                    .then(function() {
                                        OrderCloud.Payments.Patch(order.ID, vm.currentOrderPayments[index].ID, {CreditCardID: CreditCard.ID})
                                            .then(function() {
                                                $state.reload();
                                            });
                                    });
                            });
                    });
            }
            else {
                toastr.error('Invalid credit card number.', 'Error:');
            }
        }
    }

    function SetCreditCard(order, index) {
        if (vm.currentOrderPayments[index].Type === 'CreditCard') {
            OrderCloud.Payments.Patch(order.ID, vm.currentOrderPayments[index].ID, {CreditCardID: vm.currentOrderPayments[index].CreditCardID})
                .then(function() {
                    $state.reload();
                });
        }
    }

    function SetSpendingAccount(order, index) {
        if (vm.currentOrderPayments[index].SpendingAccountID && vm.currentOrderPayments[index].Type ==='SpendingAccount') {
            OrderCloud.Payments.Patch(order.ID, vm.currentOrderPayments[index].ID, {SpendingAccountID: vm.currentOrderPayments[index].SpendingAccountID})
                .then(function() {
                    $state.reload();
                })
                .catch(function(err) {
                    OrderCloud.Payments.Delete(order.ID, vm.currentOrderPayments[index].ID)
                        .then(function() {
                            $state.reload();
                            toastr.error(err.data.Errors[0].Message + ' Please choose another payment method, or another spending account.', 'Error:')
                        });
                });
        }
    }

    function CanAddPayment(order, payments) {
        var paymentTotal = 0;
        angular.forEach(payments, function(payment) {
            paymentTotal += payment.Amount;
        });
        return ((paymentTotal < order.Total) && _.pluck(vm.currentOrderPayments, ''));
    }

    function PatchPaymentAmount(order, index) {
        if (vm.currentOrderPayments[index].Amount && (vm.currentOrderPayments[index].Amount <= vm.currentOrderPayments[index].MaxAmount)) {
            OrderCloud.Payments.Patch(order.ID, vm.currentOrderPayments[index].ID, {Amount: vm.currentOrderPayments[index].Amount})
                .then(function() {
                    SetAmountMax(order);
                });
        }
    }

    function SetAmountMax(order) {
        angular.forEach(vm.currentOrderPayments, function(payment) {
            var maxAmount = order.Total - _.reduce(_.pluck(vm.currentOrderPayments, 'Amount'), function(a, b) {return a + b; });
            payment.MaxAmount = (payment.Amount + maxAmount).toString();
        });
    }

    function SavePONumber(index,order) {
        !vm.currentOrderPayments[index].xp ? vm.currentOrderPayments[index].xp = {} : vm.currentOrderPayments[index].xp;
        if (vm.currentOrderPayments[index].Type === "PurchaseOrder") {
            OrderCloud.Payments.Update(order.ID, vm.currentOrderPayments[index].ID, vm.currentOrderPayments[index])
                .then(function(){
                    toastr.success('PO Number added to Order', 'Success:');
                })
        }
    }

    function ExpirationDateChange(index) {
        if (vm.currentOrderPayments[index].CreditCard && vm.currentOrderPayments[index].CreditCard.ExpirationMonth && vm.currentOrderPayments[index].CreditCard.ExpirationYear) {
            vm.currentOrderPayments[index].CreditCard.ExpirationDate = new Date(vm.currentOrderPayments[index].CreditCard.ExpirationYear, vm.currentOrderPayments[index].CreditCard.ExpirationMonth, 0);
        }
    }
}

function OCCheckoutPayment() {
    return {
        restrict: 'E',
        templateUrl: 'checkout/payment/templates/payment.tpl.html'
    }
}
