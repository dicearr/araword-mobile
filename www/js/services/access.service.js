/**
 * Created by diego on 28/03/16.
 */

(function() {
    'use strict';

    angular
        .module('AraWord')
        .factory('accessService', accessService);

    accessService.$inject = ['$window'];

    function accessService($window) {

        var permissions = {
            'toShare': true,
            'toSave' : true,
            'toLoad':false,
            'toAdd': true,
            'toSpeech': true
        };


        var service = {
            permissions: permissions,
            saveConfig: saveConfig,
            restoreConfig: restoreConfig
        };

        return service;

        ///////////////////////

        function saveConfig() {
            $window.localStorage['perms'] = JSON.stringify(service.permissions);
        }

        function restoreConfig() {
            service.permissions = JSON.parse($window.localStorage['perms'] || JSON.stringify(permissions));
        }
    }

})();
