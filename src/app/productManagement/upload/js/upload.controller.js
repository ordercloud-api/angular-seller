angular.module('orderCloud')
    .controller('UploadCtrl', UploadController)
;

function UploadController($scope, UploadService, ProductUploadService) {
    var vm = this;
    vm.productFileData = {};
    vm.attributeFileData = {};
    vm.categoryFileData = {};
    vm.parsedCatData = null;
    vm.parsedProdData = null;
    vm.results = null;
    vm.uploadProgress = [];

    vm.selectProductFile = function() {
        //Upload for product information
        $('#productCSV').bind('change', productFileSelected);

        $('#productCSV').click();
    };

    vm.selectAttributeFile = function() {
        //Upload for product attribute information (product.xp.attributes[])
        $('#attributeCSV').bind('change', attributeFileSelected);

        $('#attributeCSV').click();
    };

    vm.selectCategoryFile = function() {
        $('#categoryCSV').bind('change', categoryFileSelected);

        $('#categoryCSV').click();
    };

    vm.clearProductFile = function() {
        vm.productFileData = {};
        vm.parsedProdData = null;
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#productCSV').val('');
    };

    vm.clearCategoryFile = function() {
        vm.categoryFileData = {};
        vm.parsedCatData = null;
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#categoryCSV').val('');
    };

    vm.clearAttributeFile = function() {
        vm.attributeFileData = {};
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#attributeCSV').val('');
    };

    function productFileSelected(event) {
        $scope.$apply(function() {
            vm.productFileData.Name = event.target.files[0].name;
            vm.productFileData.Event = event;
            vm.parsedData = null;
            if(vm.productFileData.Name && vm.attributeFileData.Name && vm.categoryFileData.Name) parsedData();
        });
    }

    function attributeFileSelected(event) {
        $scope.$apply(function() {
            vm.attributeFileData.Name = event.target.files[0].name;
            vm.attributeFileData.Event = event;
            vm.parsedData = null;
            if(vm.productFileData.Name && vm.attributeFileData.Name && vm.categoryFileData.Name) parsedData();
        });
    }

    function categoryFileSelected(event) {
        $scope.$apply(function() {
            vm.categoryFileData.Name = event.target.files[0].name;
            vm.categoryFileData.Event = event;
            vm.parsedData = null;
            if(vm.productFileData.Name && vm.attributeFileData.Name && vm.categoryFileData.Name) parsedData();
        })
    }

    function parsedData() {
        return UploadService.Parse([{ProductFile: vm.productFileData.Event}, {AttributeFile: vm.attributeFileData.Event}, {CategoryFile: vm.categoryFileData.Event}])
            .then(function(parsed) {
                var productMapping = {
                    "ID": "sku",
                    "Name": "name",
                    "Description": "description_long",
                    "CategoryID": "CategoryID",
                    "xp.url_detail": "url_detail",
                    "xp.image.URL": "image",
                    "xp.description_short": "description_short",
                    "xp.attributes": "attributes",
                    "Price": "price_retail"
                };
                var categoryMapping = {
                    "ID": "category_id",
                    "Name": "category_name",
                    "ParentID": "parent_category_id"
                };
                vm.parsedCatData = ProductUploadService.ValidateCategories(parsed.CategoryFile, categoryMapping);

                var combined = ProductUploadService.Combine(parsed.ProductFile, parsed.AttributeFile);
                vm.parsedProdData = ProductUploadService.ValidateProducts(combined.productData, productMapping);
                vm.parsedProdData.ProductCount = combined.productData.length;
                vm.parsedCatData.CategoryCount = vm.parsedCatData.Categories.length;
            });
    }

    vm.upload = function() {
        vm.results = null;
        vm.uploadProgress = [];
        var products = angular.copy(vm.parsedProdData.Products);
        var categories = angular.copy(vm.parsedCatData.Categories);
        vm.parsedData = null;
        vm.started = true;
        ProductUploadService.Upload(products, categories)
            .then(
                function(data) {
                    vm.results = data;
                },
                function(ex) {
                    console.log(ex);
                },
                function(progress) {
                    vm.uploadProgress = progress;
                }
            );
    };
}