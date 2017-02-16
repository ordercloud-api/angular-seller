angular.module('orderCloud')
    .config(function(ocRolesProvider) {
        var roleGroups = [
            {Name: 'BuyerRoles', Type: 'Any', Roles: ['BuyerReader', 'BuyerAdmin']},
            {Name: 'ProductRoles', Type: 'Any', Roles: ['ProductReader', 'ProductAdmin']},
            {Name: 'OrderRoles', Type: 'Any', Roles: ['OrderReader', 'OrderAdmin']},
            {Name: 'AdminUserRoles', Type: 'Any', Roles: ['AdminUserReader', 'AdminUserAdmin']},
            {Name: 'AdminUserGroupRoles', Type: 'Any', Roles: ['AdminUserGroupReader', 'AdminUserGroupAdmin']},
            {Name: 'AdminAddressRoles', Type: 'Any', Roles: ['OrderReader', 'OrderAdmin']}
        ];

        angular.forEach(roleGroups, function(roleGroup) {
            ocRolesProvider.AddRoleGroup(roleGroup);
        });
    })
;