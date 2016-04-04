/**
 * Created by Diego on 28/03/16.
 *
 * Manages the control access for the unprivileged user.
 */
(function() {
    'use strict';

    angular
        .module('AraWord')
        .controller('accessController', accessController);

    accessController.$inject = ['accessService'];

    function accessController(accessService) {
        var vm = this;

        // We create a copy from the configuration to use as a model
        vm.models = angular.copy(accessService.permissions);

        vm.saveConfig = saveConfig;

        /////////

        /**
         * Called when configuration must be saved.
         */
        function saveConfig() {
            accessService.permissions = angular.copy(vm.models);
            accessService.saveConfig();
        }

    }
})();
