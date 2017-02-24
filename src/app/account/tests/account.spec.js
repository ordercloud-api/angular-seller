xdescribe('Component: Account', function() {
    var scope,
        q,
        account,
        accountFactory,
        uibModalInstance;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, AccountService) {
        q = $q;
        scope = $rootScope.$new();
        account = {
            ID: "TestAccount123456789",
            Username: "TestAccount",
            Password: "Fails345",
            FirstName: "Test",
            LastName: "Test",
            Email: "test@test.com",
            TermsAccepted: true,
            Active: true
        };
        accountFactory = AccountService;
        uibModalInstance = jasmine.createSpyObj('modalInstance', ['close', 'dismiss', 'result.then']);
    }));

    describe('Factory: AccountService', function() {
        var oc;
        beforeEach(inject(function(OrderCloud) {
            oc = OrderCloud;
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Auth, 'GetToken').and.returnValue(defer.promise);
            spyOn(oc.Me, 'Update').and.returnValue(defer.promise);
        }));

        describe('Update', function() {
            var uibModal,
                currentProfile = {
                    ID: 'FAKEID',
                    Username: 'FAKEUSERNAME'
                },
                newProfile = {
                    Username: 'FAKENEWPROFILE'
                };
            beforeEach(inject(function($uibModal) {
                uibModal = $uibModal;
            }));
            it ('should open a uibModal, confirm their password, and update the user', function() {
                var defer = q.defer();
                defer.resolve('FAKEPASSWORD');
                spyOn(uibModal, 'open').and.returnValue({result: defer.promise});
                accountFactory.Update(currentProfile, newProfile);
                expect(uibModal.open).toHaveBeenCalled();
                scope.$digest();
                expect(oc.Auth.GetToken).toHaveBeenCalledWith({Username: 'FAKEUSERNAME', Password: 'FAKEPASSWORD'});
                expect(oc.Me.Update).toHaveBeenCalledWith(newProfile);
            })
        });

        describe('ChangePassword', function() {
            var currentUser = {
                ID: 'FAKEID',
                Username: 'FAKEUSERNAME',
                CurrentPassword: 'FAKECURRENTPASSWORD',
                NewPassword: 'FAKENEWPASSWORD'
            };
            it ('should check their password and update the user', function() {
                accountFactory.ChangePassword(currentUser);
                expect(oc.Auth.GetToken).toHaveBeenCalledWith({Username:currentUser.Username, Password:currentUser.CurrentPassword});
                scope.$digest();
                currentUser.Password = currentUser.NewPassword;
                expect(oc.Me.Update).toHaveBeenCalledWith(currentUser);
            })
        });
    });

    describe('Controller: AccountCtrl', function() {
        var accountInfoCtrl,
            uibModal,
            actualOptions;
        beforeEach(inject(function ($uibModal, $controller) {
            accountInfoCtrl = $controller('AccountCtrl', {
                CurrentUser: {},
                Profile: {}
            });
            uibModal = $uibModal;
            accountInfoCtrl.editInfoModalOptions = {
                animation: true,
                templateUrl: 'account/templates/accountEdit.modal.html',
                controller: 'AccountEditModalCtrl',
                controllerAs: 'accountEditModal',
                backdrop: 'static',
                size: 'md',
                resolve: {
                    Profile: jasmine.any(Function),
                    CurrentUser: jasmine.any(Function)
                }
            };
            accountInfoCtrl.changePasswordModalOptions = {
                animation: true,
                templateUrl: 'account/templates/changePassword.modal.html',
                controller: 'ChangePasswordModalCtrl',
                controllerAs: 'changePasswordModal',
                backdrop:'static',
                size: 'md',
                resolve: {
                    CurrentUser: jasmine.any(Function)
                }
            };
        }));
        xdescribe('editInfo', function() {
            it('should call the $uibModal open with editInfo modal', function() {
                spyOn(uibModal, 'open').and.callFake(function(options) {
                    actualOptions = options;
                    return uibModalInstance;
                });
                //TODO: this line breaks when chaining a .then off of $uibModal.open().result
                accountInfoCtrl.editInfo();
                expect(uibModal.open).toHaveBeenCalledWith(accountInfoCtrl.editInfoModalOptions);
            });
        });
        describe('changePassword', function() {
            it('should call the $uibModal open with changePassword modal', function() {
                spyOn(uibModal, 'open').and.callFake(function(options) {
                    actualOptions = options;
                    return uibModalInstance;
                });
                accountInfoCtrl.changePassword();
                expect(uibModal.open).toHaveBeenCalledWith(accountInfoCtrl.changePasswordModalOptions);
            });
        });
    });

    describe('Controller: AccountEditModalCtrl', function() {
       var accountEditModalCtrl, currentProfile;
        beforeEach(inject(function($state, $controller) {
           accountEditModalCtrl = $controller('AccountEditModalCtrl', {
               $uibModalInstance: uibModalInstance,
               CurrentUser: {},
               Profile: {}
           });
        }));
        describe('update', function() {
            beforeEach(inject(function() {
                currentProfile = {};
                accountEditModalCtrl.Profile = {};
                var defer = q.defer();
                defer.resolve();
                spyOn(accountFactory, 'Update').and.returnValue(defer.promise);
                accountEditModalCtrl.update();
            }));
            it('should call the Accounts Update method', inject(function() {
                expect(accountFactory.Update).toHaveBeenCalledWith(currentProfile, accountEditModalCtrl.Profile);
            }));
            it('should close the modal after the update is successful', function() {
                scope.$digest();
                expect(uibModalInstance.close).toHaveBeenCalled();
            })
        });
        describe('cancel', function() {
            it('should dismiss the modal', function() {
                accountEditModalCtrl.cancel();
                expect(uibModalInstance.dismiss).toHaveBeenCalled();
            });
        });
    });

    describe('Controller: ChangePasswordModalCtrl', function () {
        var changePasswordModalCtrl;
        beforeEach(inject(function($state, $controller) {
            changePasswordModalCtrl = $controller('ChangePasswordModalCtrl', {
                $scope: scope,
                CurrentUser: {},
                $uibModalInstance: uibModalInstance
            });
            spyOn($state, 'go').and.returnValue(true);
        }));
        describe('changePassword', function() {
            beforeEach(inject(function() {
                changePasswordModalCtrl.currentUser = account;
                var defer = q.defer();
                defer.resolve(account);
                spyOn(accountFactory, 'ChangePassword').and.returnValue(defer.promise);
                changePasswordModalCtrl.changePassword();
            }));
            it ('should call the Accounts ChangePassword method', inject(function() {
                expect(accountFactory.ChangePassword).toHaveBeenCalledWith(changePasswordModalCtrl.currentUser);
            }));
        });
        describe('submit', function() {
            it('should close the modal', function() {
                changePasswordModalCtrl.submit();
                expect(uibModalInstance.close).toHaveBeenCalled();
            });
        });
        describe('cancel', function() {
            it('should dismiss the modal', function(){
                changePasswordModalCtrl.cancel();
                expect(uibModalInstance.dismiss).toHaveBeenCalled();
            });
        });
    });
    describe('Controller: ConfirmPasswordCtrl', function () {
        var confirmPasswordCtrl;
        beforeEach(inject(function($controller) {
            confirmPasswordCtrl = $controller('ConfirmPasswordModalCtrl', {
                $uibModalInstance: uibModalInstance,
                password: 'fakepassword'
            });
        }));
        describe('submit', function() {
            it('should close the modal after confirming password', function() {
                confirmPasswordCtrl.submit();
                expect(uibModalInstance.close).toHaveBeenCalledWith(confirmPasswordCtrl.password);
            });
        });
        describe('cancel', function() {
            it('should dismiss the modal', function() {
                confirmPasswordCtrl.cancel();
                expect(uibModalInstance.dismiss).toHaveBeenCalled();
            });
        });
    });
});

