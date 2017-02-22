describe('Component: Base', function() {
    var q,
        scope,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(module('ui.router'));
    beforeEach(module(function($provide) {
        $provide.value('CurrentUser', {ID: 'FAKE_USER'})
    }));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        oc = OrderCloud;
    }));
    describe('State: base', function() {
        var state, loginService;
        beforeEach(inject(function($state, LoginService) {
            state = $state.get('base');
            loginService = LoginService;
            spyOn(loginService, 'Logout').and.callThrough();
        }));
        //Skipped this test because Base now resolves with Auth.IsAuthenticated and THEN do a Me.Get() to confirm the token will work
        it('should resolve CurrentUser', inject(function ($injector) {
            var dfd = q.defer();
            dfd.resolve('TEST USER');
            spyOn(oc.Me, 'Get').and.returnValue(dfd.promise);
            $injector.invoke(state.resolve.CurrentUser);
            expect(oc.Me.Get).toHaveBeenCalled();
            scope.$digest();
            expect(loginService.Logout).not.toHaveBeenCalled();
        }));
        it('should call LoginService.Logout() if OrderCloud.Me.Get() failed', inject(function($injector) {
            var dfd = q.defer();
            dfd.reject();
            spyOn(oc.Me, 'Get').and.returnValue(dfd.promise);
            $injector.invoke(state.resolve.CurrentUser);
            scope.$digest();
            expect(loginService.Logout).toHaveBeenCalled();
        }));
    });

    describe('Controller: BaseCtrl', function(){
        var baseCtrl;
        beforeEach(inject(function($controller, CurrentUser) {
            baseCtrl = $controller('BaseCtrl', {
                CurrentUser: CurrentUser
            });
        }));
        it ('should initialize vm.currentUser to CurrentUser', inject(function(CurrentUser) {
            expect(baseCtrl.currentUser).toBe(CurrentUser);
        }));
    });
});
