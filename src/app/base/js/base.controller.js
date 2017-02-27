angular.module('orderCloud')
    .controller('BaseCtrl', BaseController)
;

function BaseController(CurrentUser) {
    var vm = this;
    vm.currentUser = CurrentUser;

    //jasny bootstrap -- http://www.jasny.net/bootstrap/javascript/#offcanvas-usage
    $('#GlobalNav').offcanvas({ //invoke jasny offcanvas
        canvas: 'body',
        placement: 'left',
        toggle: false
    });

    vm.toggleGlobalNav = function() {
        $('#GlobalNav').offcanvas('toggle'); //toggle jasny offcanvas
    }
}