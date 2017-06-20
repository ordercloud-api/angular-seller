angular.module('orderCloud')
    .controller('BuyerCtrl', BuyerController)
;

function BuyerController($state, $exceptionHandler, toastr, OrderCloudSDK, ocBuyers, ocNavItems, SelectedBuyer) {
    var vm = this;
    vm.selectedBuyer = SelectedBuyer;
    vm.settings = angular.copy(SelectedBuyer);

    vm.updateValidity = updateValidity;
    vm.updateBuyer = updateBuyer;
    vm.deleteBuyer = deleteBuyer;
    vm.searchCatalogs = searchCatalogs;

    vm.navigationItems = ocNavItems.Filter(ocNavItems.Buyer());

    vm.fileUploadOptions = {
        keyname: 'logo',
        extensions: 'jpg, png, gif, jpeg, tiff',
        uploadText: 'Upload an image',
        replaceText: 'Replace image',
        onUpdate: patchImage,
        multiple: false
    };

    function patchImage(imageXP) {
        return OrderCloudSDK.Buyers.Patch(vm.settings.ID, {xp: imageXP})
            .then(function(data) {
                data.SelectedDefaultCatalog = vm.settings.SelectedDefaultCatalog;
                vm.selectedBuyer = data;
                SelectedBuyer = data;
                vm.settings = angular.copy(data);
                toastr.success(data.Name + ' logo was updated');
            });
    }

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
                    if (data.ID != vm.selectedBuyer.ID) $state.go('.', {
                        buyerid: data.ID
                    }, {
                        notify: false
                    });
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