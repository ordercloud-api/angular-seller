angular.module('orderCloud')
    .controller('ProductCreateModalCtrl', ProductCreateModalController);

function ProductCreateModalController($q, $exceptionHandler, $uibModalInstance, toastr, ocProductPricing, ocProducts, sdkOrderCloud) {
    var vm = this;
    vm.steps = [{
            form: 'info',
            name: 'Basic Information'
        },
        {
            form: 'pricing',
            name: 'Default Pricing'
        },
        {
            form: 'shipping',
            name: 'Shipping Information'
        },
        {
            form: 'inventory',
            name: 'Product Inventory'
        },
        {
            form: 'image',
            name: 'Product Image'
        }
    ];
    vm.currentStep = 0;
    vm.showNext = true;
    vm.initialized = true;

    vm.nextStep = function () {
        vm.currentStep++;
        _checkPrevNex();
    };

    vm.prevStep = function () {
        vm.currentStep--;
        _checkPrevNex();
    };

    function _checkPrevNex() {
        vm.showNext = vm.currentStep < vm.steps.length - 1;
        vm.showPrev = vm.currentStep > 0;
    }

    vm.product = {
        DefaultPriceSchedule: {
            RestrictedQuantity: false,
            PriceBreaks: [],
            MinQuantity: 1,
            OrderType: 'Standard'
        },
        Active: true,
        QuantityMultiplier: 1
    };

    vm.submit = submit;
    vm.cancel = cancel;

    //Price form
    vm.validatePricingForm = function () {
        vm.form.pricing.$setValidity('nopricebreaks', vm.enableDefaultPricing ? vm.product.DefaultPriceSchedule.PriceBreaks.length > 0 : true);
    };

    vm.addPriceBreak = addPriceBreak;
    vm.deletePriceBreak = deletePriceBreak;

    function addPriceBreak() {
        var numberExist = _.findWhere(vm.product.DefaultPriceSchedule.PriceBreaks, {
            Quantity: vm.quantity
        });
        if (vm.quantity > vm.product.DefaultPriceSchedule.MaxQuantity) {
            toastr.error('Max quantity exceeded', 'Error');
        } else {
            numberExist === undefined ?
                vm.product.DefaultPriceSchedule.PriceBreaks.push({
                    Price: vm.price,
                    Quantity: vm.quantity
                }) :
                toastr.error('Quantity already exists. Please delete and re-enter quantity and price to edit', 'Error');
        }
        ocProductPricing.PriceBreaks.DisplayQuantity(vm.product.DefaultPriceSchedule);
        vm.product.DefaultPriceSchedule = ocProductPricing.PriceBreaks.SetMinMax(vm.product.DefaultPriceSchedule);
        vm.form.pricing.$setValidity('nopricebreaks', true);
        vm.quantity = null;
        vm.price = null;
    }

    function deletePriceBreak(index) {
        vm.product.DefaultPriceSchedule.PriceBreaks.splice(index, 1);
        vm.product.DefaultPriceSchedule = ocProductPricing.PriceBreaks.SetMinMax(vm.product.DefaultPriceSchedule);
        vm.form.pricing.$setValidity('nopricebreaks', vm.product.DefaultPriceSchedule.PriceBreaks.length > 0);
    }

    vm.listAllAdminAddresses = listAllAdminAddresses;

    function listAllAdminAddresses(search) {
        return sdkOrderCloud.AdminAddresses.List({
                search: search
            })
            .then(function (data) {
                vm.adminAddresses = data;
            });
    }

    function submit() {
        var df = $q.defer();
        vm.loading = df.promise;

        if (vm.enableDefaultPricing) {
            var priceSchedule = angular.copy(vm.product.DefaultPriceSchedule);
            priceSchedule.Name = vm.product.Name + ' Default Price';
            sdkOrderCloud.PriceSchedules.Create(priceSchedule)
                .then(function (data) {
                    vm.product.DefaultPriceScheduleID = data.ID;
                    _createProduct();
                })
                .catch(function (ex) {
                    $exceptionHandler(ex);
                });
        } else {
            _createProduct();
        }

        function _createProduct() {
            if (vm.product.Inventory && vm.product.Inventory.Enabled) delete vm.product.Inventory;
            sdkOrderCloud.Products.Create(vm.product)
                .then(function (data) {
                        $uibModalInstance.close(data);
                });
        }
    }

    function cancel() {
        return $uibModalInstance.dismiss();
    }
}