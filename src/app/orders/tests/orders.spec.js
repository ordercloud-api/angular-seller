describe('Component: Orders', function() {
    var scope,
        q,
        oc,
        order,
        orderList,
        lineItemList,
        product,
        spendingAccount;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
        order = {
            ID: "TestOrder123456789",
            Type: "Standard",
            FromUserID: "TestUser123456789",
            BillingAddressID: "TestAddress123456789",
            ShippingAddressID: "TestAddress123456789",
            SpendingAccountID: null,
            Comments: null,
            PaymentMethod: null,
            CreditCardID: null,
            ShippingCost: null,
            TaxCost: null,
            LineItems: [
                {
                    "OrderID": "TestOrder123456789",
                    "ID": "TestLineItem123456789",
                    "ProductID": "TestProduct1234",
                    "Quantity": 1,
                    "LineTotal": 1.0,
                    "Product": {
                        "ID": "TestProduct1234",
                        "Name": "TestProduct1234",
                        "Description": "TestProduct1234",
                        "QuantityMultiplier": 1,
                        "Active": true
                    }
                }
            ],
            SpendingAccount: {
                "Name": "TestSpendingAccount1234",
                "ID": "TestSpendingAccount1234",
                "ActionOnExceed": "None",
                "AllowExceed": false,
                "AutoRenew": false,
                "AutoRenewAmount": null,
                "AutoRenewRollOverBalance": false,
                "AutoRenewDays": null,
                "HideWhenUnavailable": false,
                "MaxPercentOfTotal": 0,
                "AllowAsPaymentMethod": false,
                "Balance": 0.0,
                "AssignedUserID": "TestUser1234"
            }
        };
        lineItemList = {
            Items: [
                {
                    "OrderID": "TestOrder123456789",
                    "ID": "TestLineItem123456789",
                    "ProductID": "TestProduct1234",
                    "Quantity": 1,
                    "LineTotal": 1.0,
                    "Product": {
                        "ID": "TestProduct1234",
                        "Name": "TestProduct1234",
                        "Description": "TestProduct1234",
                        "QuantityMultiplier": 1,
                        "Active": true
                    }
                }
            ],
            Meta: {
                Page: 1,
                PageSize: 1,
                TotalCount: 1,
                TotalPages: 1,
                ItemRange: [0, 1]
            }
        };
        product = {
            "ID": "TestProduct1234",
            "Name": "TestProduct1234",
            "Description": "TestProduct1234",
            "QuantityMultiplier": 1,
            "Active": true
        };
        spendingAccount = {
            "Name": "TestSpendingAccount1234",
            "ID": "TestSpendingAccount1234",
            "ActionOnExceed": "None",
            "AllowExceed": false,
            "AutoRenew": false,
            "AutoRenewAmount": null,
            "AutoRenewRollOverBalance": false,
            "AutoRenewDays": null,
            "HideWhenUnavailable": false,
            "MaxPercentOfTotal": 0,
            "AllowAsPaymentMethod": false,
            "Balance": 0.0,
            "AssignedUserID": "TestUser1234"
        };
    }));

    describe('State: orders', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('orders');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.Auth, 'ReadToken').and.returnValue('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3IiOiJDT05OT1JfSk9ITlNPTiIsImNpZCI6ImY1NjdjZTQ2LTNjMjQtNDZiZS1hOWM5LTMyN2ZhYmFkZWJiMyIsImltcCI6ImMxIiwidXNydHlwZSI6ImJ1eWVyIiwicm9sZSI6IkZ1bGxBY2Nlc3MiLCJpc3MiOiJodHRwczovL2F1dGgub3JkZXJjbG91ZC5pbyIsImF1ZCI6Imh0dHBzOi8vYXBpLm9yZGVyY2xvdWQuaW8iLCJleHAiOjE0NTQ5NzI2MDgsIm5iZiI6MTQ1NDk2OTAwOH0.RmWy4hoDzSLaWmlY3pxkOZ3OC2ZTRgzmpiEu_SN8YMk');
            spyOn(oc.Orders, 'ListOutgoing').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve UserType', inject(function($injector) {
            var userType = $injector.invoke(state.resolve.UserType);
            expect(userType).toBeDefined();
        }));
        it('should resolve OrderList', inject(function($injector) {
            var userType = $injector.invoke(state.resolve.UserType);
            $injector.invoke(state.resolve.OrderList, scope, {OrderCloud: oc, UserType: userType});
            expect(oc.Orders.ListOutgoing).toHaveBeenCalled();
        }));
    });

    describe('State: orders.detail', function() {
        var state;
        beforeEach(inject(function($state, OrdersFactory) {
            state = $state.get('orders.detail');
            spyOn(OrdersFactory, 'GetOrderDetails').and.returnValue(null);
        }));
        it('should resolve SelectedOrder', inject(function($injector, $stateParams, OrdersFactory) {
            $injector.invoke(state.resolve.SelectedOrder);
            expect(OrdersFactory.GetOrderDetails).toHaveBeenCalledWith($stateParams.orderid);
        }));
    });

    describe('State: orders.detail.lineItem', function() {
        var state;
        beforeEach(inject(function($state, OrdersFactory) {
            state = $state.get('orders.detail.lineItem');
            spyOn(OrdersFactory, 'GetLineItemDetails').and.returnValue(null);
        }));
        it('should resolve SelectedLineItem', inject(function($injector, $stateParams, OrdersFactory) {
            $injector.invoke(state.resolve.SelectedLineItem);
            expect(OrdersFactory.GetLineItemDetails).toHaveBeenCalledWith($stateParams.orderid, $stateParams.lineitemid);
        }));
    });


    describe('Factory: OrdersFactory', function() {
        var ordersService, orderID, productID, filters;
        beforeEach(inject(function(OrdersFactory) {
            ordersService = OrdersFactory;
            var orderDefer = q.defer();
            var orderListDefer = q.defer();
            var lineItemDefer = q.defer();
            var productDefer = q.defer();
            var spendingAccountDefer = q.defer();
            orderDefer.resolve(order);
            orderListDefer.resolve(orderList);
            lineItemDefer.resolve(lineItemList);
            productDefer.resolve(product);
            spendingAccountDefer.resolve(spendingAccount);
            spyOn(oc.Orders, 'Get').and.returnValue(orderDefer.promise);
            spyOn(oc.LineItems, 'List').and.returnValue(lineItemDefer.promise);
            spyOn(oc.Products, 'Get').and.returnValue(productDefer.promise);
            spyOn(oc.SpendingAccounts, 'Get').and.returnValue(spendingAccountDefer.promise);
            spyOn(oc.Orders, 'ListIncoming').and.returnValue(orderListDefer.promise);
            //scope.$digest();
        }));

        describe('GetOrderDetails', function() {
            beforeEach(function() {
                orderID = "TestOrder123456789";
                productID = "TestProduct1234";
                order.SpendingAccountID = "TestSpendingAccount1234";
                ordersService.GetOrderDetails(orderID);
                scope.$digest();
            });
            it ('should call an Order Get', function() {
                expect(oc.Orders.Get).toHaveBeenCalledWith(orderID);
            });
            it ('should call a Line Item List', function() {
                expect(oc.LineItems.List).toHaveBeenCalledWith(orderID, null, 1, 100);
            });
            it ('should call a Product Get', function() {
                expect(oc.Products.Get).toHaveBeenCalledWith(productID);
            });
            it ('should call a SpendingAccounts Get', function(){
                expect(oc.SpendingAccounts.Get).toHaveBeenCalledWith(order.SpendingAccountID);
            });
        });

        describe('SearchOrders', function() {
            beforeEach(function() {
                filters = {OrderID: "TestOrder123456789", Status: "Open", FromCompanyID: "TestCompany", FromDate: new Date(), ToDate: new Date(), searchTerm: "TestTerm", sortType: null, groupOrders: null};
                ordersService.SearchOrders(filters, 'admin');
                scope.$digest();

            });
            it ('should call an Order List', function() {
                expect(oc.Orders.ListIncoming).toHaveBeenCalledWith(filters.FromDate, filters.ToDate, filters.searchTerm, 1, 100, null, null, {ID: filters.OrderID, Status: filters.Status, FromUserID: filters.groupOrders}, filters.FromCompanyID);
            });
        })
        //TODO: these tests are incomplete
    });
});