angular.module('orderCloud')
    .factory('ocCatalogTree', OrderCloudCatalogTreeService)
    .config(OrderCloudCatalogTreeConfig)
;
function OrderCloudCatalogTreeService($q, OrderCloud) {
    return {
        Get: _getTree,
        UpdateCategoryNode: update
    };

    function _getTree(categoryArray) {
        var tree = [];
        var deferred = $q.defer();

        var query = _.where(categoryArray, {
            ParentID: null
        });
        angular.forEach(query, function(node) {
            tree.push(getnode(node));
        });

        function getnode(node) {
            var children = _.where(categoryArray, {
                ParentID: node.ID
            });
            if (children.length > 0) {
                node.children = children;
                angular.forEach(children, function(child) {
                    return getnode(child);
                });
            } else {
                node.children = [];
            }
            return node;
        }
        deferred.resolve(tree);
        
        return deferred.promise;
    }

    function update(event, catalogid) {
        var sourceParentNodeList = event.source.nodesScope.$modelValue,
            destParentNodeList = event.dest.nodesScope.$modelValue,
            masterDeferred = $q.defer();

        updateNodeList(destParentNodeList).then(function() {
            if (sourceParentNodeList != destParentNodeList) {
                if (sourceParentNodeList.length) {
                    updateNodeList(sourceParentNodeList).then(function() {
                        updateParentID().then(function() {
                            masterDeferred.resolve();
                        });
                    });
                } else {
                    updateParentID().then(function() {
                        masterDeferred.resolve();
                    });
                }
            }
        });

        function updateNodeList(nodeList) {
            var deferred = $q.defer(),
                nodeQueue = [];
            angular.forEach(nodeList, function(cat, index) {
                nodeQueue.push((function() {
                    return OrderCloud.Categories.Patch(cat.ID, {
                        ListOrder: index
                    }, catalogid);
                }));
            });

            var queueIndex = 0;

            function run(i) {
                nodeQueue[i]().then(function() {
                    queueIndex++;
                    if (queueIndex < nodeQueue.length) {
                        run(queueIndex);
                    } else {
                        deferred.resolve();
                    }
                });
            }
            run(queueIndex);

            return deferred.promise;
        }

        function updateParentID() {
            var deferred = $q.defer(),
                parentID;

            if (event.dest.nodesScope.node) {
                parentID = event.dest.nodesScope.node.ID;
            } else {
                parentID = null;
            }
            event.source.nodeScope.node.ParentID = parentID;
            OrderCloud.Categories.Update(event.source.nodeScope.node.ID, event.source.nodeScope.node, catalogid)
                .then(function() {
                    deferred.resolve();
                });
            return deferred.promise;
        }

        return masterDeferred.promise;
    }
}

function OrderCloudCatalogTreeConfig(treeConfig){
    treeConfig.treeClass = 'angular-ui-tree';
    treeConfig.emptyTreeClass = 'angular-ui-tree-empty';
    treeConfig.hiddenClass = 'angular-ui-tree-hidden';
    treeConfig.nodesClass = 'angular-ui-tree-nodes';
    treeConfig.nodeClass = 'angular-ui-tree-node';
    treeConfig.handleClass = 'angular-ui-tree-handle';
    treeConfig.placeholderClass = 'angular-ui-tree-placeholder';
    treeConfig.dragClass = 'angular-ui-tree-drag';
    treeConfig.dragThreshold = 3;
    treeConfig.defaultCollapsed = false;
    treeConfig.appendChildOnHover = true;
}