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

        var socialMedia = true;
        var saveDocs = true;
        var loadDocs = true;
        var addPict = true;
        var textToSpeech = true;

        var service = {
            socialMedia: socialMedia,
            saveDocs: saveDocs,
            loadDocs: loadDocs,
            addPict: addPict,
            textToSpeech: textToSpeech,
            saveConfig: saveConfig,
            restoreConfig: restoreConfig
        };

        return service;

        //////////////////////7

        function saveConfig() {
            $window.localStorage['socialMedia'] = service.socialMedia;
            $window.localStorage['saveDocs'] = service.saveDocs;
            $window.localStorage['loadDocs'] = service.loadDocs;
            $window.localStorage['addPict'] = service.addPict;
            $window.localStorage['textToSpeech'] = service.textToSpeech;
            console.log(JSON.stringify({'save':'save', 'sm': service.socialMedia, 'sd': service.saveDocs, 'ld': service.loadDocs,'tts':service.textToSpeech}));

        }

        function restoreConfig() {
            service.socialMedia = ($window.localStorage['socialMedia'] || "true") == "true";
            service.saveDocs = ($window.localStorage['saveDocs'] || "true") == "true";
            service.loadDocs = ($window.localStorage['loadDocs'] || "true") == "true";
            service.addPict = ($window.localStorage['addPict'] || "true") == "true";
            service.textToSpeech = ($window.localStorage['textToSpeech'] || "true") == "true";
            console.log(JSON.stringify({'restore':'restore', 'sm': service.socialMedia, 'sd': service.saveDocs, 'ld': service.loadDocs,'tts':service.textToSpeech}));
        }
    }

})();
