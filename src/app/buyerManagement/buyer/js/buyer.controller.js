angular.module('orderCloud')
    .controller('BuyerCtrl', BuyerController)
;

function BuyerController($timeout, $scope, $window, $state, $exceptionHandler, toastr, OrderCloudSDK, ocBuyers, SelectedBuyer) {
    var vm = this;
    vm.selectedBuyer = SelectedBuyer;
    vm.settings = angular.copy(SelectedBuyer);

    vm.updateValidity = updateValidity;
    vm.updateBuyer = updateBuyer;
    vm.deleteBuyer = deleteBuyer;
    vm.searchCatalogs = searchCatalogs;

    vm.navigationItems = [{
            icon: 'fa-dollar',
            state: 'buyerProducts',
            name: 'Pricing'
        },
        {
            icon: 'fa-sitemap',
            state: 'buyerCatalogs',
            name: 'Categories',
            activeWhen: ['buyerCatalogs', 'buyerCatalog']
        },
        {
            icon: 'fa-user',
            state: 'users',
            name: 'Users'
        },
        {
            icon: 'fa-users',
            state: 'userGroups',
            name: 'User Groups',
            activeWhen: ['userGroups', 'userGroup']
        },
        {
            icon: 'fa-map-marker',
            state: 'addresses',
            name: 'Addresses'
        },
        {
            icon: 'fa-credit-card',
            state: 'creditCards',
            name: 'Credit Cards'
        },
        {
            icon: 'fa-money',
            state: 'spendingAccounts',
            name: 'Spending Accounts'
        },
        {
            icon: 'fa-asterisk',
            state: 'costCenters',
            name: 'Cost Centers'
        },
        {
            icon: 'fa-check-square-o',
            state: 'approvalRules',
            name: 'Approval Rules'
        },
        {
            icon: 'fa-bullhorn',
            state: 'promotions',
            name: 'Promotions'
        }
    ];

    function updateValidity() {
        if (vm.settingsForm.buyerIDinput.$error['UnavailableID']) vm.settingsForm.buyerIDinput.$setValidity('UnavailableID', true);
    }

    function updateBuyer() {
        var options = {
            catalogID: vm.settings.SelectedDefaultCatalog.ID,
            buyerID: SelectedBuyer.ID
        };
        if (vm.settings.DefaultCatalogID !== vm.settings.SelectedDefaultCatalog.ID) {
            vm.settings.DefaultCatalogID = vm.settings.SelectedDefaultCatalog.ID;
            vm.loading = OrderCloudSDK.Catalogs.ListAssignments(options)
                .then(function (data) {
                    if (data.Items.length > 0) {
                        return saveBuyer();
                    } else {
                        return createAssignment();
                    }
                });
        } else {
            vm.loading = saveBuyer();
        }

        function createAssignment() {
            var assignmentModel = angular.extend(options, {
                ViewAllCategories: true,
                ViewAllProducts: true
            });
            return OrderCloudSDK.Catalogs.SaveAssignment(assignmentModel)
                .then(function () {
                    return saveBuyer();
                });
        }

        function saveBuyer() {
            return OrderCloudSDK.Buyers.Update(SelectedBuyer.ID, vm.settings)
                .then(function (data) {
                    data.SelectedDefaultCatalog = vm.settings.SelectedDefaultCatalog;
                    vm.selectedBuyer = data;
                    SelectedBuyer = data;
                    vm.settings = angular.copy(data);
                    toastr.success(data.Name + ' was updated');
                    vm.settingsForm.$setPristine();
                })
                .catch(function (ex) {
                    if (ex.status === 409) {
                        vm.settingsForm.buyerIDinput.$setValidity('UnavailableID', false);
                        vm.settingsForm.buyerIDinput.$$element[0].focus();
                    } else {
                        $exceptionHandler(ex);
                    }
                });
        }

    }

    function deleteBuyer() {
        ocBuyers.Delete(vm.selectedBuyer)
            .then(function () {
                toastr.success(vm.selectedBuyer.Name + ' was deleted.');
                $state.go('buyers');
            });
    }

    function searchCatalogs(term) {
        var options = {
            search: term,
            page: 1,
            pageSize: 8
        };
        return OrderCloudSDK.Catalogs.List(options)
            .then(function (data) {
                return data.Items;
            });
    }
}