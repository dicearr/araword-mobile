/**
 * Created by diego on 28/03/16.
 */
(function() {
    'use strict';

    angular
        .module('AraWord')
        .controller('accessController', accessController);

    accessController.$inject = ['accessService'];

    function accessController(accessService) {
        var vm = this;

        vm.socialMedia = angular.copy(!accessService.socialMedia);
        vm.saveDocs = angular.copy(!accessService.saveDocs);
        vm.loadDocs = angular.copy(!accessService.loadDocs);
        vm.addPict = angular.copy(!accessService.addPict);
        vm.textToSpeech = angular.copy(!accessService.textToSpeech);
        vm.saveConfig = saveConfig;

        /////////

        function saveConfig() {
            accessService.socialMedia = !vm.socialMedia;
            accessService.saveDocs = !vm.saveDocs;
            accessService.loadDocs = !vm.loadDocs;
            accessService.addPict = !vm.addPict;
            accessService.textToSpeech = !vm.textToSpeech;
            accessService.saveConfig();
        }

    }
})();
