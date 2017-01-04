describe('Component: CostCenters', function() {
    var scope,
        q,
        costCenter,
        oc;
    beforeEach(module(function($provide) {
        $provide.value('Parameters', {search:null, page: null, pageSize: null, searchOn: null, sortBy: null, userID: null, userGroupID: null, level: null, buyerID: null})
    }));
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        costCenter = {
            ID: "TestCostCenter123456789",
            Name: "TestCostCenterTest",
            Description: "Test Cost Center Description"
        };
        oc = OrderCloud;
    }));

    describe('State: costCenters', function() {
        var state;
        beforeEach(inject(function($state, OrderCloudParameters) {
            state = $state.get('costCenters');
            spyOn(OrderCloudParameters, 'Get').and.returnValue(null);
            spyOn(oc.CostCenters, 'List').and.returnValue(null);
        }));
        it('should resolve Parameters', inject(function($injector, OrderCloudParameters) {
            $injector.invoke(state.resolve.Parameters);
            expect(OrderCloudParameters.Get).toHaveBeenCalled();
        }));
        it('should resolve CostCenterList', inject(function($injector) {
            $injector.invoke(state.resolve.CostCentersList);
            expect(oc.CostCenters.List).toHaveBeenCalled();
        }));
    });

    describe('State: costCenters.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('costCenters.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.CostCenters, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedCostCenter', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCostCenter);
            expect(oc.CostCenters.Get).toHaveBeenCalledWith($stateParams.costcenterid);
        }));
    });

    describe('State: costCenters.assign', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('costCenters.assign');
            spyOn(oc.Buyers, 'Get').and.returnValue(null);
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.CostCenters, 'ListAssignments').and.returnValue(null);
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.CostCenters, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve Buyer', inject(function($injector) {
            $injector.invoke(state.resolve.Buyer);
            expect(oc.Buyers.Get).toHaveBeenCalled();
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve AssignmentsList', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignedUserGroups);
            expect(oc.CostCenters.ListAssignments).toHaveBeenCalledWith($stateParams.costcenterid);
        }));
        it('should resolve SelectedCostCenter', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedCostCenter);
            expect(oc.CostCenters.Get).toHaveBeenCalledWith($stateParams.costcenterid);
        }));
    });

    describe('Controller: CostCenterEditCtrl', function() {
        var costCenterEditCtrl;
        beforeEach(inject(function($state, $controller) {
            costCenterEditCtrl = $controller('CostCenterEditCtrl', {
                $scope: scope,
                SelectedCostCenter: costCenter
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                costCenterEditCtrl.costCenter = costCenter;
                costCenterEditCtrl.costCenterID = "TestCostCenter123456789";
                var defer = q.defer();
                defer.resolve(costCenter);
                spyOn(oc.CostCenters, 'Update').and.returnValue(defer.promise);
                costCenterEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the CostCenters Update method', function() {
                expect(oc.CostCenters.Update).toHaveBeenCalledWith(costCenterEditCtrl.costCenterID, costCenterEditCtrl.costCenter);
            });
            it ('should enter the costCenters state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('costCenters', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(costCenter);
                spyOn(oc.CostCenters, 'Delete').and.returnValue(defer.promise);
                costCenterEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the CostCenters Delete method', function() {
                expect(oc.CostCenters.Delete).toHaveBeenCalledWith(costCenter.ID);
            });
            it ('should enter the costCenters state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('costCenters', {}, {reload: true});
            }));
        });
    });

    describe('Controller: CostCenterCreateCtrl', function() {
        var costCenterCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            costCenterCreateCtrl = $controller('CostCenterCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                costCenterCreateCtrl.costCenter = costCenter;
                var defer = q.defer();
                defer.resolve(costCenter);
                spyOn(oc.CostCenters, 'Create').and.returnValue(defer.promise);
                costCenterCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the CostCenters Create method', function() {
                expect(oc.CostCenters.Create).toHaveBeenCalledWith(costCenter);
            });
            it ('should enter the costCenters state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('costCenters', {}, {reload: true});
            }));
        });
    });

    describe('Controller: CostCenterAssignCtrl', function() {
        var costCenterAssignCtrl;
        beforeEach(inject(function($state, $controller) {
            costCenterAssignCtrl = $controller('CostCenterAssignCtrl', {
                $scope: scope,
                UserGroupList: [],
                AssignedUserGroups: [],
                SelectedCostCenter: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('SaveAssignment', function() {
            beforeEach(inject(function(Assignments) {
                var defer = q.defer();
                defer.resolve();
                spyOn(Assignments, 'SaveAssignments').and.returnValue(defer.promise);
                costCenterAssignCtrl.saveAssignments();
            }));
            it ('should call the Assignments saveAssignments method', inject(function(Assignments) {
                expect(Assignments.SaveAssignments).toHaveBeenCalled();
            }));
        });

        describe('PagingFunction', function() {
            beforeEach(inject(function(Paging) {
                spyOn(Paging, 'Paging').and.returnValue(null);
                costCenterAssignCtrl.pagingfunction();
            }));
            it ('should call the Paging paging method', inject(function(Paging) {
                expect(Paging.Paging).toHaveBeenCalled();
            }));
        });
    });
});

