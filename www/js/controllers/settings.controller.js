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

    settingsController.$inject = ['configService','$ionicPopover','$scope','verbsdb',
        'araworddb', '$rootScope', '$timeout'];

    /**
     * Controller
     * @param configService - Required to save the configuration
     * @param $ionicPopover - Required to show popovers
     * @param $scope - Required to access to the controller from the popovers
     * @param verbsdb - Required to change the formed verbs database
     * @param araworddb - Required to change the database language
     * @param $rootScope - Required to broadcast 'reload' event when language changes
     * @param $timeout - Required to broadcast through rootScope
     * @param textAnalyzer - Required to access to the current text
     */
    function settingsController(configService, $ionicPopover, $scope, verbsdb,
                                araworddb, $rootScope, $timeout) {

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
        vm.supported = vm.modifiedConfig.supportedLangs;
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
         * @param {String} color - The color to be chosen
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
            var origSupp = configService.configuration.supportedLangs;
            if (vm.modifiedConfig.docLang.code != configService.configuration.docLang.code) {
                $timeout(function () {
                    $rootScope.$broadcast('reloadText', 'newLang');
                });
            }
            verbsdb.setLang(vm.modifiedConfig.docLang.code);
            araworddb.setLang(vm.modifiedConfig.docLang.code);
            origSupp.forEach(function(lang, ind) {
                if (lang.code == vm.modifiedConfig.docLang.code) {
                    vm.modifiedConfig.docLang.code = origSupp[ind].code;
                    vm.modifiedConfig.docLang = lang;
                }
            });
            configService.configuration = angular.copy(vm.modifiedConfig);
            configService.saveConfig();
        }

    }

})();