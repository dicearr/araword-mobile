/**
 * Created by diego on 29/02/16.
 *
 * Manages the configuration screen. Obtains the values
 * from the configuration service.
 */
(function() {

    'use strict';

    angular
        .module('AraWord')
        .controller('settingsController', settingsController);

    settingsController.$inject = ['configService','$ionicPopover','$scope','$translate'];

    function settingsController(configService, $ionicPopover, $scope) {

        var vm = this;

        // We copy the configuration to use it as a model
        vm.modifiedConfig = angular.copy(configService.configuration);

        vm.colors = ['green','blue','red','yellow','orange','purple','black','white', 'gray', 'pink'];
        $ionicPopover.fromTemplateUrl('templates/popovers/colors.html', {
            scope: $scope
        }).then(function(popover){
            $scope.colorsBar = popover;
        });

        vm.showColorBar = showColorBar;
        vm.selectColor = selectColor;
        vm.saveConfig = saveConfig;
        vm.updateStyles = updateStyles;

        var typeSelected = undefined;

        //////////////////////

        /**
         * Updates styles to be fetched from the view.
         */
        function updateStyles() {
            vm.fontStyle = {
                'font-size': vm.modifiedConfig['fontSize'] + 'px'
            };
            vm.pictoStyle = {
                '-webkit-filter': 'grayscale('+vm.modifiedConfig['grayScale']+'\%)',
                'width': vm.modifiedConfig['pictoSize'] + 'px'
            };
        }

        /**
         * Shows the color bar when any type is tapped
         * @param event {{ used to positioning popover }}
         * @param type {{ type tapped }}
         */
        function showColorBar(event, type) {
            $scope.colorsBar.show(event);
            typeSelected = type;
        }

        /**
         * Chooses a color from the popover.
         * @param color {{ choosen color }}
         */
        function selectColor(color) {
            if (!angular.isUndefined(typeSelected)) {
                typeSelected['color'] = color;
                typeSelected = undefined;
                $scope.colorsBar.hide();
            }
        }


        /**
         * Saves the whole configuration
         */
        function saveConfig() {
            configService.configuration = angular.copy(vm.modifiedConfig);
            configService.saveConfig();
        }

    }

})();