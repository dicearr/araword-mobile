/**
 * Created by Diego on 29/02/16.
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
                url: '/splash',
                templateUrl: 'templates/splash.html',
                controller: 'splashController',
                controllerAs: 'splash'
            })

            // Text editor
            .state('text', {
                url: '/text',
                templateUrl: 'templates/text.html',
                controller: 'textController',
                controllerAs: 'text'
            })

            // Profile settings
            .state('settings', {
                url: '/settings',
                templateUrl: 'templates/settings.html',
                controller: 'settingsController',
                controllerAs: 'sett'
            })
            // Control access settings
            .state('access', {
                url: '/access',
                templateUrl: 'templates/access.html',
                controller: 'accessController',
                controllerAs: 'access'
            });

        $urlRouterProvider.otherwise('/splash');
    }

})();