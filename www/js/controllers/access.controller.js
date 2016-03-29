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

        // We create a copy to use as a model
        vm.models = angular.copy(accessService.permissions);

        vm.saveConfig = saveConfig;

        /////////

        /**
         * Called when configuration must be saved.
         */
        function saveConfig() {
            console.log('Models='+JSON.stringify(vm.models));
            accessService.permissions = angular.copy(vm.models);
            accessService.saveConfig();
        }

    }
})();
