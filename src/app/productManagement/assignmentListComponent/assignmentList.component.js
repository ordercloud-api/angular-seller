angular.module('orderCloud')
    .component('ocAssignmentList', {
        bindings: {
            productid : '<',
            buyerid : '<'
        },
        templateUrl : 'productManagement/assignmentListComponent/templates/assignmentList.html',
        controller : ocAssignmentListCtrl,
        controllerAs: 'productAssignment'
    })
;

// when the component first loads, it takes into account whether there is a buyer id or not.
// If there is no buyerid, a productid value should be present in order to make the buyer assignments call
// when the buyerid or productid is changed it will make an api call to filter based on buyer ID and product ID
function ocAssignmentListCtrl($q, $resource, OrderCloud){
    var vm = this;
    vm.priceSchedules = null;
    vm.$onInit = $onInit;
    vm.$onChanges = onChanges;
    vm.DeleteAssignment = DeleteAssignment;
    vm.getBuyers = getBuyers;


    function $onInit(){

    }

    function onChanges(change){
        if( change && change.buyerid && change.buyerid.currentValue){
            // console.log("here is whats happening a", change);
             OrderCloud.Products.ListAssignments(vm.productid, null, null, null, null, null, null, change.buyerid.currentValue.ID)
                 .then(function(data){
                     vm.listAssignments = data;
                 })
                 .catch(function(ex){
                     console.warn(ex)
                 })
        }
        if( change && change.productid &&change.productid.currentValue){
            // console.log("here is whats happening b", change);
            vm.getBuyers();
        }

    }
    function getBuyers(){
        //loading indicator promise
        var df =  $q.defer();
        var queue = [];
        df.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
        df.message = 'Loading Assignments';
        vm.loading = df;

        var apiUrl = 'https://api.ordercloud.io/v1/products/assignments';
        var parameters = { 'productID': vm.productid, 'buyerID': null };
        $resource(apiUrl, parameters, {
            callApi: {
                method: 'GET',
                headers: {'Authorization': 'Bearer ' + OrderCloud.Auth.ReadToken()}
            }
        }).callApi(null).$promise
            .then(function(data) {

                var assignments = _.groupBy(data.Items, function(assignment){return assignment.PriceScheduleID});
                angular.forEach(assignments, function(value, key){
                    queue.push(OrderCloud.PriceSchedules.Get(key));
                });
                $q.all(queue)
                    .then(function(pricescheduleInfo){
                        angular.forEach(pricescheduleInfo, function(value, index){
                        pricescheduleInfo[index].Assignments = assignments[value.ID];
                        });
                        df.resolve(data, pricescheduleInfo);
                        vm.listAssignments = pricescheduleInfo;
                    });
            })
            .catch(function(ex) {
                console.warn(ex)
            });
    }
    function DeleteAssignment(scope) {
        console.log("hello the delete assignment function is being called", scope)
        OrderCloud.Products.DeleteAssignment(scope.assignment.ProductID, null, scope.assignment.UserGroupID)
            .then(function() {
                $state.reload();
                toastr.success('Product Assignment Deleted', 'Success');
                $state.go('.',{},{reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };


}