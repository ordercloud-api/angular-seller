angular.module('orderCloud')
    .config(UserGroupCatalogConfig)
;

function UserGroupCatalogConfig($stateProvider) {
    $stateProvider
        .state('userGroupCatalog', {
            parent: 'userGroup',
            url: '/catalog/:catalogid',
            templateUrl: 'catalogManagement/userGroupCatalog/templates/userGroupCatalog.html',
            controller: 'UserGroupCatalogCtrl',
            controllerAs: 'userGroupCatalog',
            data: {
                pageTitle: 'User Group Catalog'
            },
            resolve: {
                SelectedCatalog: function($stateParams, sdkOrderCloud) {
                    return sdkOrderCloud.Catalogs.Get($stateParams.catalogid);
                },
                CatalogAssignment: function($stateParams, sdkOrderCloud) {
                    var options = {
                        catalogID: $stateParams.catalogid,
                        userGroupID: $stateParams.userGroupid
                    }
                    return sdkOrderCloud.Catalogs.ListAssignments(options)
                        .then(function(data) {
                            return data.Items[0];
                        });
                },
                BuyerCategoryAssignments: function($stateParams, ocCatalogCategories) {
                    return ocCatalogCategories.Assignments.Get($stateParams.catalogid, $stateParams.buyerid);
                },
                UserGroupCategoryAssignments: function($stateParams, ocCatalogCategories) {
                    return ocCatalogCategories.Assignments.Get($stateParams.catalogid, $stateParams.buyerid, $stateParams.usergroupid);
                },
                CategoryList: function($stateParams, ocCatalogCategories) {
                    return ocCatalogCategories.GetAll($stateParams.catalogid);
                },
                Tree: function(CategoryList, ocCatalogTree, ocCatalogCategories, CatalogAssignment, BuyerCategoryAssignments, UserGroupCategoryAssignments) {
                    var buyerMappedData = ocCatalogCategories.Assignments.Map(CategoryList, CatalogAssignment.ViewAllCategories ? true : BuyerCategoryAssignments, true);
                    var userGroupMappedData = CatalogAssignment.ViewAllCategories ? {} : ocCatalogCategories.Assignments.Map(CategoryList, UserGroupCategoryAssignments);
                    var assignedBuyerCategoryIDs = _.pluck(buyerMappedData, 'ID');

                    angular.forEach(userGroupMappedData, function(category) {
                        var index = _.findIndex(buyerMappedData, function(cat) {
                            return cat.ID == category.ID;
                        })
                        if (!buyerMappedData[index].Assigned) buyerMappedData[index] = category;
                    })

                    return ocCatalogTree.Get(buyerMappedData);
                }
            }
        })
}