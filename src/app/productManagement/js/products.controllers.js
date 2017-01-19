angular.module('orderCloud')
    .controller('ProductsCtrl', ProductsController)
    .controller('ProductCreateCtrl', ProductCreateController)
    .controller('ProductDetailCtrl', ProductDetailController)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)
;

function ProductsController($state, $ocMedia, OrderCloud, OrderCloudParameters, ProductList, Parameters) {
    var vm = this;
    vm.list = ProductList;
    //Set parameters
    vm.parameters = Parameters;
    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection);
    //Sort by is a filter on mobile devices
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;
    vm.showFilters = vm.filtersApplied;

    vm.clearFilters = clearFilters; //Clear relevant filters, reload the state & reset the page
    vm.clearSearch =  clearSearch; //Clear the search parameter, reload the state & reset the page
    vm.filter = filter; //Reload the state with new parameters
    vm.loadMore = loadMore; //Load the next page of results with all of the same parameters
    vm.pageChanged = pageChanged; //Reload the state with the incremented page parameter
    vm.reverseSort = reverseSort; //Used on mobile devices
    vm.search = search; //Reload the state with new search parameter & reset the page
    vm.updateSort = updateSort; //Conditionally set, reverse, remove the sortBy parameter & reload the state

    function filter(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    }

    function search() {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, true), {notify:false}); //don't trigger $stateChangeStart/Success, this is just so the URL will update with the search
        vm.searchLoading = OrderCloud.Products.List(vm.parameters.search, 1, vm.parameters.pageSize || 12, vm.parameters.searchOn, vm.parameters.sortBy, vm.parameters.filters)
            .then(function(data) {
                vm.list = data;
                vm.searchResults = vm.parameters.search.length > 0;
            })
    }

    function clearSearch() {
        vm.parameters.search = null;
        vm.filter(true);
    }

    function clearFilters() {
        vm.parameters.filters = null;
        vm.parameters.from = null;
        vm.parameters.to = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    }

    function updateSort(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    }

    function reverseSort() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    }

    function pageChanged() {
        $state.go('.', {page:vm.list.Meta.Page});
    }

    function loadMore() {
        return OrderCloud.Products.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    }
}

function ProductCreateController($exceptionHandler, $state, toastr, OrderCloud) {
    var vm = this;

    vm.product = {};
    vm.product.Active = true;
    vm.product.QuantityMultiplier = 1;

    vm.submit = submit;

    function submit() {
        OrderCloud.Products.Create(vm.product)
            .then(function(data) {
                vm.product.ID = data.ID;
                toastr.success('Product Saved', 'Success');
                $state.go('products.detail.createAssignment', {productid: vm.product.ID}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    }
}

function ProductDetailController($exceptionHandler, $state, toastr, OrderCloud, OrderCloudConfirm, SelectedProduct) {
    var vm = this;
    vm.product = angular.copy(SelectedProduct);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.inventoryEnabled = angular.copy(SelectedProduct.InventoryEnabled);
    vm.updateProduct = updateProduct;
    vm.deleteProduct = deleteProduct;

    function updateProduct() {
        var partial = _.pick(vm.product, ['ID', 'Name', 'Description', 'QuantityMultiplier', 'InventoryEnabled']);
        vm.productUpdateLoading = OrderCloud.Products.Patch(SelectedProduct.ID, partial)
            .then(function(data) {
                vm.product = angular.copy(data);
                vm.productName = angular.copy(data.Name);
                vm.inventoryEnabled = angular.copy(data.InventoryEnabled);
                SelectedProduct = data;
                vm.InfoForm.$setPristine();
                toastr.success(data.Name + ' was updated', 'Success!');
            })
    }

    function deleteProduct(){
        OrderCloudConfirm.Confirm('Are you sure you want to delete this product?')
            .then(function(){
                OrderCloud.Products.Delete(vm.productID)
                    .then(function() {
                        toastr.success('Product Deleted', 'Success');
                        $state.go('products', {}, {reload: true});
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex)
                    });
            });
    }
}

function ProductCreateAssignmentController($state, toastr, OrderCloud, ocProductsService, SelectedProduct, Buyers, PriceBreak) {
    var vm = this;
    vm.buyers = Buyers;
    vm.product = SelectedProduct;
    vm.selectedBuyer = null;
    vm.priceSchedule = {
        RestrictedQuantity: false,
        PriceBreaks: [],
        MinQuantity: 1,
        OrderType: 'Standard'
    };
    vm.getBuyerUserGroups = getBuyerUserGroups;
    vm.saveAssignment = saveAssignment;
    vm.addPriceBreak = addPriceBreak;
    vm.deletePriceBreak = PriceBreak.DeletePriceBreak;
    vm.assignAtUserGroupLevel = false;

    function addPriceBreak() {
        PriceBreak.AddPriceBreak(vm.priceSchedule, vm.price, vm.quantity);
        vm.quantity = null;
        vm.price = null;
    }

    function getBuyerUserGroups(){
        vm.selectedUserGroups = null;
        OrderCloud.UserGroups.List(null, 1, 20, null, null, null, vm.selectedBuyer.ID)
            .then(function(data){
                vm.buyerUserGroups = data;
            });
    }

    function saveAssignment() {
        ocProductsService.CreateNewPriceScheduleAndAssignments(vm.product, vm.priceSchedule, vm.selectedBuyer, vm.selectedUserGroups)
            .then(function(data) {
                toastr.success('Assignment Created', 'Success');
                $state.go('^', {}, {reload: true});
            })
            .catch(function (ex) {
                toastr.error('An error occurred while trying to save your product assignment', 'Error');
            });
    }
}