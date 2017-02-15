angular.module('orderCloud')
    .directive('ocIfRoles', OrderCloudIfRoles)
;

function OrderCloudIfRoles(ocRoles) {
    var directive = {
        multiElement: true,
        restrict: 'A',
        priority: 599, //ngIf has priority 600 and terminal: true -- therefore, this directive is ignored if ngIf removes element
        link: link
    };

    function link(scope, element, attr, ctrl) {
        var attrValue = attr.ocIfRoles;

        if (attrValue && !/[^a-z]/i.test(attrValue)) {
            //string value
            analyzeRoles([attrValue]);
        }
        else {
            scope.$watch(attr.ocIfRoles, function ocIfWatchAction(value) {
                if (angular.isArray(value) && value.length && (typeof value[0] == 'string')) {
                    //array value
                    analyzeRoles(value);
                }
            });
        }

        function analyzeRoles(requiredRoles) {
            var userRoles = ocRoles.Get();
            if (!ocRoles.IsAuthorized(userRoles, requiredRoles)) {
                removeElement();
            }
        }

        function removeElement() {
            element.before('<!-- ocIfPermissions: ' + attr.ocIfRoles + ' -->');
            element.remove();
        }
    }

    return directive;
}