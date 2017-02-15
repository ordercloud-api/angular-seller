angular.module('orderCloud')
    .controller('BaseCtrl', BaseController)
;

function BaseController(CurrentUser) {
    var vm = this;
    vm.currentUser = CurrentUser;
}