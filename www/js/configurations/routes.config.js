/**
 * Created by diego on 29/02/16.
 *
 * Manages views, controllers and paths.
 */
(function(){
    'use strict';

    angular
        .module('AraWord')
        .config(routes);

    routes.$inject = ['$stateProvider', '$urlRouterProvider'];

    function routes($stateProvider, $urlRouterProvider) {

        $stateProvider

            // Splash screen
            .state('splash', {
                url: '/',
                templateUrl: 'templates/splash.html',
                controller: 'splashController',
                controllerAs: 'splash'
            })

            // Text editor (main route)
            .state('text', {
                url: '/text',
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