angular.module('orderCloud')
    .controller('CatalogAssignmentsCtrl', CatalogAssignmentsController)
;

 function CatalogAssignmentsController($q, toastr, $rootScope, OrderCloud, ProductManagementModal, Tree, CatalogID){
     var vm = this;
     vm.productIds = null;
     vm.pageSize = 10; //set pageSize for pagination. Max: 100
     vm.catalogID = CatalogID;
     vm.tree = Tree;
     vm.category = null;
     vm.products = null;
     //vm.selectedProducts = [];

     $rootScope.$on('CatalogViewManagement:CategoryIDChanged', function(e, category){
         vm.category = category;
         getProducts();
     });

     function getProducts(page){
         OrderCloud.Categories.ListProductAssignments(vm.category.ID, null, page, vm.pageSize, vm.catalogID)
            .then(function(assignmentList){
                vm.productIds = _.pluck(assignmentList.Items, 'ProductID');
                if(!vm.productIds.length) {
                    vm.products = null;
                } else {
                    var filter = {ID: vm.productIds.join('|')};
                    OrderCloud.Products.List(null, null, 100, null, null, filter)
                        .then(function(productList){
                            productList.Meta = assignmentList.Meta;
                            vm.products = productList;
                        });
                }
            });
     }

     vm.pageChanged = function() {
         getProducts(vm.products.Meta.Page);
    };

     vm.listAllProducts = function(product){
         return OrderCloud.Products.List(product)
             .then(function(data){
                 vm.listProducts = data;
             });
     };

     vm.saveAssignment = function(){
         var productQueue = [];
         var df = $q.defer();
         angular.forEach(vm.selectedProducts, function(product){
             productQueue.push(OrderCloud.Categories.SaveProductAssignment(
                 {
                    ProductID :  product.ID,
                    CategoryID : vm.category.ID
                 },
                 vm.catalogID
             ));
         });
         $q.all(productQueue)
             .then(function(data){
                 console.log(data);
                 df.resolve();
                 toastr.success('All Products Saved', 'Success');
             })
             .catch(function(error){
                 toastr.error(error.data.Errors[0].Message);
             })
             .finally(function(){
                 getProducts();
                 vm.selectedProducts = null;
             });
         return df.promise;
     }
         
     vm.addProductModal = function(){
         ProductManagementModal.AssignProductToCategory(vm.category.ID, vm.catalogID);
     };

     vm.deleteAssignment = function(product){
         OrderCloud.Categories.DeleteProductAssignment(vm.category.ID, product.ID, vm.catalogID)
             .then(function(){
                 toastr.success('Product ' + product.Name + ' Removed from Category ' + vm.category.ID);
             })
             .catch(function(error){
                 toastr.error('There was an error removing products from the category');
             })
             .finally(function(){
                 getProducts();
             })
     }
     
 }