/**
 * Created by diego on 28/03/16.
 *
 * Manages the acces control permissions.
 */
(function() {
    'use strict';

    angular
        .module('AraWord')
        .factory('accessService', accessService);

    accessService.$inject = ['$window'];

    function accessService($window) {

        // Permissions set
        var permissions = {
            'toShare': true,
            'toSave' : true,
            'toLoad':true,
            'toAdd': true,
            'toSpeech': true,
            'toSend': true
        };


        var service = {
            permissions: permissions,
            logged: false,
            saveConfig: saveConfig,
            restoreConfig: restoreConfig
        };

        return service;

        ///////////////////////

        /**
         * Stores permissions.
         */
        function saveConfig() {
            $window.localStorage['perms'] = JSON.stringify(service.permissions);
        }

        /**
         * Restores permissions.
         */
        function restoreConfig() {
            service.permissions = JSON.parse($window.localStorage['perms'] || JSON.stringify(permissions));
        }
    }

})();
