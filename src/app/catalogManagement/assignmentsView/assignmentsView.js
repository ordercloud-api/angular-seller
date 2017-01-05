angular.module('orderCloud')
    .controller('CatalogAssignmentsCtrl', CatalogAssignmentsController)
;

 function CatalogAssignmentsController($q, $exceptionHandler, toastr, $rootScope, OrderCloud, ProductManagementModal, Tree, CatalogID){
     var vm = this;
     vm.productIds = null;
     vm.pageSize = 10; //set pageSize for pagination. Max: 100
     vm.catalogID = CatalogID;
     vm.tree = Tree;
     vm.category = null;
     vm.products = null;
     vm.selectedProducts = [];

     //functions
     vm.addProductModal = addProductModal;
     vm.deleteAssignment = deleteAssignment;
     vm.listAllProducts = listAllProducts;
     vm.pageChanged = pageChanged;
     vm.saveAssignment = saveAssignment;
     
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

     function pageChanged() {
         getProducts(vm.products.Meta.Page);
    }

     function listAllProducts(product){
         return OrderCloud.Products.List(product)
             .then(function(data){
                 vm.listProducts = data;
             });
     }

     function saveAssignment(){
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
             .then(function(){
                 df.resolve();
                 toastr.success('Products Assigned to ' + vm.category.Name, 'Success');
             })
             .catch(function(error){
                 $exceptionHandler(error);
             })
             .finally(function(){
                 getProducts();
                 vm.selectedProducts = null;
             });
         return df.promise;
     }
         
     function addProductModal(){
         ProductManagementModal.AssignProductToCategory(vm.category.ID, vm.catalogID);
     }

     function deleteAssignment(product){
         OrderCloud.Categories.DeleteProductAssignment(vm.category.ID, product.ID, vm.catalogID)
             .then(function(){
                 toastr.success(product.Name + ' Removed from ' + vm.category.Name);
             })
             .catch(function(error){
                 $exceptionHandler(error);
             })
             .finally(function(){
                 getProducts();
             });
     }
 }