describe('Component: AdminAddresses', function(){
    var scope,
        q,
        adminAddress,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        scope = $rootScope.$new();
        q = $q;
        adminAddress = {
            CompanyName: "TestComp",
            FirstName: "Test",
            LastName: "Testing",
            Street1: "123 4th Ave N",
            Street2: "#200",
            City: "Minneapolis",
            State: "MN",
            Zip: "55403",
            Country: "US",
            AddressName: "TestAddressTest",
            ID: "TestAddress123456789"
        };
        oc = OrderCloud
    }));
    describe('State: adminAddresses', function(){
        var state;
        beforeEach(inject(function($state, OrderCloudParameters){
            state = $state.get('adminAddresses');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.AdminAddresses, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve AddressList', inject(function($injector){
            $injector.invoke(state.resolve.AddressList);
            expect(oc.AdminAddresses.List).toHaveBeenCalled();
        }))
    });
    describe('State: adminAddresses.edit', function(){
        var state;
        beforeEach(inject(function($state){
            state = $state.get('adminAddresses.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.AdminAddresses, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedAdminAddress', inject(function($injector, $stateParams){
            $injector.invoke(state.resolve.SelectedAdminAddress);
            expect(oc.AdminAddresses.Get).toHaveBeenCalledWith($stateParams.addressid);
        }))
    });
    describe('Controller: AdminAddressEditCtrl', function(){
        var adminAddressEditCtrl;
        beforeEach(inject(function($state, $controller){
            adminAddressEditCtrl = $controller('AdminAddressEditCtrl', {
                $scope: scope,
                SelectedAdminAddress: adminAddress
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function(){
            beforeEach(function(){
                adminAddressEditCtrl.adminAddress = adminAddress;
                adminAddressEditCtrl.adminAddressID = "TestAddress123456789";
                var defer = q.defer();
                defer.resolve(adminAddress);
                spyOn(oc.AdminAddresses, 'Update').and.returnValue(defer.promise);
                adminAddressEditCtrl.Submit();
                scope.$digest();
            });
            it('should call the AdminAddresses Update method', function(){
                expect(oc.AdminAddresses.Update).toHaveBeenCalledWith(adminAddressEditCtrl.adminAddressID, adminAddressEditCtrl.adminAddress);
            });
            it('should enter the adminAddresses state', inject(function($state){
               expect($state.go).toHaveBeenCalledWith('adminAddresses', {}, {reload:true});
            }));
        });
        describe('Delete', function(){
           beforeEach(function(){
               var defer = q.defer();
               defer.resolve(adminAddress);
               spyOn(oc.AdminAddresses, 'Delete').and.returnValue(defer.promise);
               adminAddressEditCtrl.Delete();
               scope.$digest();
           });
           it('should call the AdminAddresses Delete method', function(){
               expect(oc.AdminAddresses.Delete).toHaveBeenCalledWith(adminAddress.ID, false);
           });
           it('should enter the adminAddresses state', inject(function($state){
               expect($state.go).toHaveBeenCalledWith('adminAddresses', {}, {reload: true});
           }))
        });
    });
    describe('Controller: AdminAddressCreateCtrl', function(){
        var adminAddressCreateCtrl;
        beforeEach(inject(function($state, $controller){
            adminAddressCreateCtrl = $controller('AdminAddressCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));
        describe('Submit', function(){
            beforeEach(function(){
                adminAddressCreateCtrl.adminAddress = {
                    Country: 'US'
                };
                var defer = q.defer();
                defer.resolve(adminAddress);
                spyOn(oc.AdminAddresses, 'Create').and.returnValue(defer.promise);
                adminAddressCreateCtrl.Submit();
                scope.$digest();
            });
            it('should call the AdminAddresses Create method', function(){
                expect(oc.AdminAddresses.Create).toHaveBeenCalledWith(adminAddressCreateCtrl.adminAddress);
            });
            it('should enter the adminAddresses state', inject(function($state){
                expect($state.go).toHaveBeenCalledWith('adminAddresses', {}, {reload:true});
            }))
        })
    })
});