angular.module('orderCloud')
    .directive('ocResponsiveTabs', function ($state, $window) {
        var directive = {
            scope: {
                navItems: '='
            },
            templateUrl: 'common/directives/oc-responsive-tabs/oc-responsive-tabs.html',
            controller: function ($scope, $element) {
                $scope.isActive = function (navItem) {
                    var isActive = false;
                    if (navItem === 'more') {
                        var dropdownItems = _.filter($scope.navItems, {
                            dropdown: true
                        });
                        _.each(dropdownItems, checkNavItem);
                    } else if (navItem !== 'more') {
                        checkNavItem(navItem);
                    }

                    function checkNavItem(item) {
                        if (!isActive) {
                            if (!item.activeWhen) {
                                if (item.state) {
                                    isActive = $state.is(item.state);
                                } else {
                                    var splitItem = item.split('*');
                                    isActive = $state[splitItem.length > 1 ? 'includes' : 'is'](splitItem[0]);
                                }
                            } else {
                                _.each(item.activeWhen, checkNavItem);
                            }
                        }
                    }
                    return isActive;
                };

                this.$onInit = function () {
                    _.each($scope.navItems, function (item) {
                        item.dropdown = false;
                    });
                };

                this.$doCheck = function () {
                    if ($scope.isRendered) return;
                    var tabElements = $element[0].children[0].children;
                    if (tabElements[lastIndex] && tabElements[lastIndex].clientWidth) {
                        $scope.isRendered = true;
                    }
                };

                $scope.isRendered = false;
                var lastIndex = $scope.navItems.length;
                var tabs = [];

                $scope.$watch('isRendered', function (n) {
                    if (n) {
                        angular.forEach($element[0].children[0].children, function (tabEl) {
                            tabs.push(tabEl.clientWidth);
                        });
                        evaluateVisibleTabs();
                    }
                });

                angular.element($window).bind('resize', function () {
                    if (!$scope.isRendered) return;
                    return evaluateVisibleTabs(true);
                });

                function evaluateVisibleTabs(applyScope) {
                    var parentWidth = $element[0].clientWidth;
                    var reservedWidth = tabs[tabs.length - 1];
                    var previousHiddenCount = _.filter($scope.navItems, {dropdown:true}).length;

                    angular.forEach($scope.navItems, function (item, $index) {
                        reservedWidth += tabs[$index];
                        item.dropdown = reservedWidth >= parentWidth;
                    });

                    if (applyScope && previousHiddenCount !== _.filter($scope.navItems, {dropdown:true}).length) $scope.$apply();
                }
            }
        };
        return directive;
    });