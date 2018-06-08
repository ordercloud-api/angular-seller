angular.module('orderCloud')
    .controller('BaseCtrl', BaseController);

function BaseController(CurrentUser, $state, ocNavItems) {
    var vm = this;
    vm.currentUser = CurrentUser;
    vm.navItemsLeft = ocNavItems.Filter(ocNavItems.TopNavLeft());
    vm.navItemsRight = ocNavItems.Filter(ocNavItems.TopNavRight());

    vm.isActive = function(activeWhen) {
        var result = false;
        angular.forEach(activeWhen, function(stateName) {
            if ($state.includes(stateName)) result = true;
        });
        return result;
    };

    vm.addContainerClass = function() {
        var result = false;
        var containedStates = ['products', 'sellerMessageSenders', 'catalogs', 'buyers', 'home', 'orders', 'sellerUsers', 'sellerUserGroups', 'sellerUserGroup*', 'sellerAddresses', 'permissions'];
        _.each(containedStates, function (state) {
            if (result === true) return;
            var test = state.split('*');
            if ($state[(test.length > 1) ? 'includes' : 'is'](test[0])) result = true;
        });
        return result;
    };

    //jasny bootstrap -- http://www.jasny.net/bootstrap/javascript/#offcanvas-usage
    $('#GlobalNav').offcanvas({ //invoke jasny offcanvas
        canvas: 'body',
        placement: 'left',
        toggle: false
    });

    vm.toggleGlobalNav = function () {
        $('#GlobalNav').offcanvas('toggle'); //toggle jasny offcanvas
    };

    vm.selectNavItem = function (stateName) {
        $state.go(stateName);
        $('#GlobalNav').offcanvas('hide'); //hide jasny offcanvas
    };
}