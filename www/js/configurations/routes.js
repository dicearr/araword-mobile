/**
 * Created by diego on 29/02/16.
 */
(function(){
    'use strict';

    angular
        .module('app')
        .config(routes);

    routes.$inject = ['$stateProvider', '$urlRouterProvider'];

    function routes($stateProvider, $urlRouterProvider) {

        $stateProvider

            // Text editor
            .state('text', {
                url: '/',
                templateUrl: 'templates/text.html',
                controller: 'textController',
                controllerAs: 'text'
            })

            // Settings
            .state('settings', {
                url: '/settings',
                templateUrl: 'templates/settings.html',
                controller: 'settingsController',
                controllerAs: 'sett'
            });

        $urlRouterProvider.otherwise('/');
    }

})();