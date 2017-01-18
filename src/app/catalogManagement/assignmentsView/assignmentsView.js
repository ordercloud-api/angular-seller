angular.module('orderCloud')
    .controller('CatalogAssignmentsCtrl', CatalogAssignmentsController)
;

 function CatalogAssignmentsController($q, $exceptionHandler, toastr, $rootScope, OrderCloud, CategoryModalFactory, Tree, CatalogID, SelectedBuyer){
     var vm = this;
     vm.assignmentType = 'buyer';
     vm.productIds = null;
     vm.pageSize = 10; //set pageSize for pagination. Max: 100
     vm.catalogID = CatalogID;
     vm.buyerID = SelectedBuyer.ID; //default configuration assumes one catalog per buyer
     vm.tree = Tree;
     vm.category = null;
     vm.products = null;
     vm.uiSelectProducts; //list of selected products
     vm.userGroups = null;
     vm.uiSelectedGroups; //list of selected userGroups
     vm.selectedProducts = [];
     vm.selectedUserGroups = [];

     //functions
     vm.deleteAssignment = deleteAssignment;
     vm.deletePartyAssignment = deletePartyAssignment;
     vm.listAllProducts = listAllProducts; // available products for ui-select
     vm.listAllUserGroups = listAllUserGroups; //available userGroups for ui-select
     vm.productPageChanged = productPageChanged;
     vm.userGroupPageChanged = userGroupPageChanged;
     vm.saveAssignment = saveAssignment;
     vm.savePartyAssignment = savePartyAssignment;
     vm.toggleBuyerAssignment = toggleBuyerAssignment;


     vm.editCategory = function(id){
         CategoryModalFactory.Edit(id, vm.catalogID)
             .then(function(data) {
                 vm.category = data;
             })
     };
     vm.deleteCategory = function(id) {
         CategoryModalFactory.Delete(id, vm.catalogID)
             .then(function(data) {

             })
     };
     
     $rootScope.$on('CatalogViewManagement:CategoryIDChanged', function(e, category){
         vm.category = category;
         getProducts();
         getUserGroups();
         isAssignedAtBuyerLevel();
     });

     function getProducts(page){
         OrderCloud.Categories.ListProductAssignments(vm.category.ID, null, page || 1, vm.pageSize, vm.catalogID)
            .then(function(assignmentList){
                vm.productIds = _.pluck(assignmentList.Items, 'ProductID');
                if(!vm.productIds.length) {
                    vm.products = null;
                } else {
                    var filter = {ID: vm.productIds.join('|')};
                    OrderCloud.Products.List(null, null, vm.pageSize, null, null, filter)
                        .then(function(productList){
                            productList.Meta = assignmentList.Meta;
                            vm.products = productList;
                        });
                }
            });
     }

     function getUserGroups(page){
         OrderCloud.Categories.ListAssignments(vm.category.ID, null, null, null, page || 1, vm.pageSize, vm.buyerID, vm.catalogID)
            .then(function(assignmentList){
                //get list of userGroupIDs. Remove any null values (from buyerID assignments);
                var userGroupIDs =  _.compact(_.pluck(assignmentList.Items, 'UserGroupID'));
                if(!userGroupIDs.length) {
                    vm.userGroups = null;
                } else {
                    var filter = {ID: userGroupIDs.join('|')};
                    OrderCloud.UserGroups.List(null, null, vm.pageSize, null, null, filter, vm.buyerID)
                        .then(function(userGroupList){
                            userGroupList.Meta = assignmentList.Meta;
                            vm.userGroups = userGroupList;
                        });
                }
            });
     }

     function isAssignedAtBuyerLevel(){
         OrderCloud.Categories.ListAssignments(vm.category.ID, null, null, 'Company', null, null, vm.buyerID, vm.catalogID)
            .then(function(buyerAssignment){
                vm.assignmentType = (buyerAssignment.Meta.TotalCount) ? 'buyer' : 'userGroups';
            });
     }

     function productPageChanged() {
         getProducts(vm.products.Meta.Page);
    }

    function userGroupPageChanged(){
        getUserGroups(vm.userGroups.Meta.Page);
    }

     function listAllProducts(product){
         return OrderCloud.Products.List(product)
             .then(function(data){
                 vm.uiSelectProducts = data;
             });
     }

     function listAllUserGroups(userGroup){
         return OrderCloud.UserGroups.List(userGroup, null, null, null, null, null, vm.buyerID)
            .then(function(data){
                vm.uiSelectedGroups = data;
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
                 toastr.success('Products assigned to ' + vm.category.Name, 'Success');
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

     function savePartyAssignment(){
         var queue = [];
         var dfd = $q.defer();
         
         angular.forEach(vm.selectedUserGroups, function(userGroup){
             var assignment = {
                CategoryID: vm.category.ID,
                BuyerID: vm.buyerID,
                UserID: null,
                UserGroupID: userGroup.ID
            };
             queue.push(OrderCloud.Categories.SaveAssignment(assignment, vm.catalogID));
         });
         $q.all(queue)
            .then(function(){
                dfd.resolve();
                toastr.success('User Groups assigned to ' + vm.category.Name, 'Success');
            })
            .catch(function(error){
                $exceptionHandler(error);
            })
            .finally(function(){
                getUserGroups();
                vm.selectedUserGroups = null;
            });
     }

     function toggleBuyerAssignment() {
         var assignment = {
             CategoryID: vm.category.ID,
             BuyerID: vm.buyerID,
             UserID: null,
             UserGroupID: null
         };

         if(vm.assignmentType === 'buyer') {
             OrderCloud.Categories.SaveAssignment(assignment, vm.catalogID)
                .then(function(){
                    toastr.success('Buyer organization assigned to ' + vm.category.Name, 'Success');
                })
                .catch(function(error){
                    $exceptionHandler(error);
                });
         } else {
             vm.deletePartyAssignment();
         }
     }

     function deleteAssignment(product){
         OrderCloud.Categories.DeleteProductAssignment(vm.category.ID, product.ID, vm.catalogID)
             .then(function(){
                 toastr.success(product.Name + ' removed from ' + vm.category.Name);
             })
             .catch(function(error){
                 $exceptionHandler(error);
             })
             .finally(function(){
                 getProducts();
             });
     }

     function deletePartyAssignment(userGroup){
         var userGroupID = userGroup ? userGroup.ID : null;
         OrderCloud.Categories.DeleteAssignment(vm.category.ID, null, userGroupID, vm.buyerID, vm.catalogID)
            .then(function(){
                var party = userGroup ? userGroup.Name : 'Buyer organization';
                toastr.success(party + ' removed from ' + vm.category.Name);
                getUserGroups();
            });
     }
 }