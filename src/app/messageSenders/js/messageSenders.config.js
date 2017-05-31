angular.module('orderCloud')
    .config(MessageSendersConfig)
;

function MessageSendersConfig($stateProvider) {
    $stateProvider
        .state('sellerMessageSenders', {
            parent: 'base',
            url: '/notifications',
            templateUrl: 'messageSenders/templates/messageSenders.html',
            controller: 'MessageSendersCtrl',
            controllerAs: 'messageSenders',
            data: {
                pageTitle: 'Seller Notifications',
                message: 'Each notification enabled at this level will be inherited by <em>all seller users</em> within <b>{{application.name()}}</b>.'
            },
            resolve: {
                AvailableMessageSenders: function($stateParams, ocMessageSenders) {
                    return ocMessageSenders.List($stateParams);
                }
            }
        })
        .state('sellerUserGroup.messageSenders', {
            url: '/notifications',
            templateUrl: 'messageSenders/templates/messageSenders.html',
            controller: 'MessageSendersCtrl',
            controllerAs: 'messageSenders',
            data: {
                pageTitle: 'Seller User Group Notifications',
                message: 'Each notification enabled at this level will be inherited by <em>all seller users</em> within <b>{{sellerUserGroup.group.Name}}</b>.'
            },
            resolve: {
                AvailableMessageSenders: function($stateParams, ocMessageSenders) {
                    return ocMessageSenders.List($stateParams);
                }
            }
        })
        .state('buyerMessageSenders', {
            parent: 'buyer',
            url: '/notifications',
            templateUrl: 'messageSenders/templates/messageSenders.html',
            controller: 'MessageSendersCtrl',
            controllerAs: 'messageSenders',
            data: {
                pageTitle: 'Buyer Notifications',
                message: 'Each permission enabled at this level will be inherited by <em>all buyer users</em> within <b>{{buyer.selectedBuyer.Name}}</b>.'
            },
            resolve: {
                AvailableMessageSenders: function($stateParams, ocMessageSenders) {
                    return ocMessageSenders.List($stateParams);
                }
            }
        })
        .state('userGroup.messageSenders', {
            url: '/notifications',
            templateUrl: 'messageSenders/templates/messageSenders.html',
            controller: 'MessageSendersCtrl',
            controllerAs: 'messageSenders',
            data: {
                pageTitle: 'User Group Permissions',
                message: 'Each permission enabled at this level will be inherited by <em>all buyer users</em> within <b>{{userGroup.group.Name}}</b>.'
            },
            resolve: {
                AvailableMessageSenders: function($stateParams, ocMessageSenders) {
                    return ocMessageSenders.List($stateParams);
                }
            }
        });
}