describe('Component: AdminAddresses', function(){
    var scope,
        q,
        adminAddress,
        adminAddressList,
        oc,
        ocGeo;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(inject(function($q, $rootScope, OrderCloud, ocGeography) {
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
        adminAddressList = {
            Meta: {
                Page:1,
                PageSize:20,
                ItemRange: [0, 1],
                TotalCount:1,
                TotalPages:1
            },
            Items: [adminAddress]
        };
        oc = OrderCloud;
        ocGeo = ocGeography;
    }));
    describe('State: adminAddresses', function(){
        var state;
        beforeEach(inject(function($state, ocParameters){
            state = $state.get('adminAddresses');
            spyOn(ocParameters, 'Get').and.returnValue(null);
            spyOn(oc.AdminAddresses, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, ocParameters){
            $injector.invoke(state.resolve.Parameters);
            expect(ocParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve AddressList', inject(function($injector){
            $injector.invoke(state.resolve.AddressList);
            expect(oc.AdminAddresses.List).toHaveBeenCalled();
        }))
    });
    describe('Service: ocAdminAddresses', function(){
        var uibModal, confirm;
        beforeEach(inject(function($uibModal, ocConfirm) {
            uibModal = $uibModal;
            confirm = ocConfirm;
        }));

        describe('Create', function() {
            it('should open adminAddressCreateModal using $uibModal')
        });

        describe('Edit', function() {
            it('should open adminAddressEditModal using $uibModal');
            it('should pass the SelectedAddress to the $uibModal resolve')
        });

        describe('Delete', function() {
            it('should call ocConfirm.Confirm');
            it('should call OrderCloud.AdminAddresses.Delete() if they confirm')
        })
    });
    describe('Controller: AdminAddressesCtrl', function() {
        var adminAddresses, stateSvc, toastrSvc, ocAdminAddressesSvc, ocParametersSvc;
        beforeEach(inject(function($controller, $state, toastr, ocAdminAddresses, ocParameters, Parameters) {
            stateSvc = $state;
            toastrSvc = toastr;
            ocAdminAddressesSvc = ocAdminAddresses;
            ocParametersSvc = ocParameters;
            adminAddresses = $controller('AdminAddressesCtrl', {
                $state:stateSvc,
                toastr: toastrSvc,
                OrderCloud: oc,
                ocAdminAddresses: ocAdminAddressesSvc,
                ocParameters: ocParametersSvc,
                AddressList: adminAddressList,
                Parameters: Parameters
            })
        }));
        describe('Initialize', function() {
            it('should set vm.list to AddressList');
            it('should set vm.parameters to Parameters');
            it('should set vm.sortSelection based on Parameters');
            it('should set vm.searchResults based on Parameters.search');
        });
        describe('Function: vm.filter', function() {
            it('should reload the state with ocParameters.Create()');
        });
        describe('Function: vm.search', function() {
            it('should reload the state with ocParameters.Create() and notify set to false');
            it('should call OrderCloud.AdminAddresses.List()');
            it('should set vm.list equal to the response');
            it('should set reset vm.searchResults based on vm.parameters.search');
        });
        describe('Function: vm.clearSearch', function() {
            it('should set vm.parameters.search to null');
            it('should call vm.filter(resetPage:true)');
        });
        describe('Function: vm.updateSort', function() {
            it('should set vm.parameters.sortBy to the value passed in');
            it('should call vm.filter(resetPage:false)');
        });
        describe('Function: vm.loadMore', function() {
            it('should call OrderCloud.AdminAddresses.List() with the new page');
            it('should add data.Items to the vm.list.Items array');
            it('should set vm.list.Meta to the response data.Meta');
        });
        describe('Function: vm.createAddress', function() {
            it('should call ocAdminAddresses.Create()');
            it('should push the new address to vm.list.Items');
            it('should increment vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
        describe('Function: vm.editAddress', function() {
            it('should call ocAdminAddresses.Edit()');
            it('should update the vm.list.Item[$index] with the updated address');
            it('should display a success toast');
        });
        describe('Function: vm.deleteAddress', function() {
            it('should call ocAdminAddresses.Delete()');
            it('should splice the deleted address from vm.list.Items');
            it('should decrement vm.list.Meta.TotalCount and vm.list.Meta.ItemRange[1]');
            it('should display a success toast');
        });
    });
    describe('Modal Controllers', function() {
        var uibModalInstance, exceptionHandler;
        beforeEach(inject(function($uibModalInstance, $exceptionHandler){
            uibModalInstance = $uibModalInstance;
            exceptionHandler = $exceptionHandler;
        }));
        describe('Controller: AdminAddressEditModalCtrl', function() {
            var adminAddressEditModalCtrl;
            beforeEach(inject(function($controller){
                adminAddressEditModalCtrl = $controller('AdminAddressEditModalCtrl', {
                    $uibModalInstance: uibModalInstance,
                    $exceptionHandler: exceptionHandler,
                    $scope: scope,
                    SelectedAddress: adminAddress,
                    ocGeography:ocGeo,
                    OrderCloud: oc
                });
            }));
            describe('Initialize', function() {
                it ('should set vm.adminAddress to a copy of the SelectedAddress');
                it ('should set vm.adminAddressName equal to SelectedAddress.AddressName');
                it ('should set vm.countries and vm.states to ocGeography countries and states');
            });
            describe('Function: vm.submit()', function() {
                it ('should call OrderCloud.AdminAddresses.Update()');
                it ('should close the modal with the updatedAddress');
            });
            describe('Function: vm.cancel()', function() {
                it ('should dismiss the modal');
            })
        });
        describe('Controller: AdminAddressCreateModalCtrl', function() {
            var adminAddressCreateModalCtrl;
            beforeEach(inject(function($controller){
                adminAddressCreateModalCtrl = $controller('AdminAddressCreateModalCtrl', {
                    $uibModalInstance: uibModalInstance,
                    $exceptionHandler: exceptionHandler,
                    $scope: scope,
                    ocGeography:ocGeo,
                    OrderCloud: oc
                });
            }));
            describe('Initialize', function() {
                it ('should set vm.adminAddress to a new object {Country:"US"}');
                it ('should set vm.countries and vm.states to ocGeography countries and states');
            });
            describe('Function: vm.submit()', function() {
                it ('should call OrderCloud.AdminAddresses.Create()');
                it ('should close the modal with the newAddress');
            });
            describe('Function: vm.cancel()', function() {
                it ('should dismiss the modal');
            })
        });
    });
});