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

        var pictoStyle = configService.pictoStyle;
        var wordStyle = configService.wordStyle;

        vm.setGrayValue = setGrayValue;
        // We need numeric value to ng-model
        vm.grayValue = pictoStyle['-webkit-filter']
            .substring(10,pictoStyle['-webkit-filter'].indexOf('%'));

        vm.setPictoSizeValue = setPictoSizeValue;
        // We need numeric value to ng-model
        vm.pictoStyle = angular.copy(pictoStyle);
        vm.pictoSizeValue = vm.pictoStyle['width']
            .substring(0,vm.pictoStyle['width'].indexOf('p'));

        vm.setFontSizeValue = setFontSizeValue;
        // We need numeric value to ng-model
        vm.fontSizeValue = wordStyle['fontSize']
            .substring(0,wordStyle['fontSize'].indexOf('p'));
        vm.fontStyle = {
            'fontSize': vm.fontSizeValue + 'px'
        };

        vm.saveConfig = saveConfig;
        vm.bordersValue = configService.borders;
        vm.wordPosition = configService.wordPosition;

        vm.colors = ['green','blue','red','yellow','orange','purple','black','white', 'grey', 'pink'];
        $ionicPopover.fromTemplateUrl('templates/popovers/colors.html', {
            scope: $scope
        }).then(function(popover){
            $scope.colorsBar = popover;
        });

        vm.showColorBar = showColorBar;
        vm.selectColor = selectColor;

        var typeSelected = undefined;
        vm.modifiedColors = angular.copy(configService.typeColors);

        //////////////////////

        function showColorBar(event, type) {
            $scope.colorsBar.show(event);
            typeSelected = type;
        }

        function selectColor(color) {
            if (!angular.isUndefined(typeSelected)) {
                typeSelected['color'] = color;
                typeSelected = undefined;
                $scope.colorsBar.hide();
            }
        }

        /**
         * Changes the gray scale value
         */
        function setGrayValue() {
          vm.pictoStyle['-webkit-filter'] = 'grayscale('+vm.grayValue+'%)';
        }

        /**
         * Changes the pictograph size
         */
        function setPictoSizeValue() {
            vm.pictoStyle['width'] = vm.pictoSizeValue + 'px';
        }

        /**
         * Changes the font size
         */
        function setFontSizeValue() {
            vm.fontStyle = {
                'fontSize': vm.fontSizeValue + 'px'
            };
        }

        /**
         * Saves the whole configuration
         */
        function saveConfig() {
            configService.setWordFontSize(vm.fontSizeValue);
            configService.setPictoGrayscale(vm.grayValue);
            configService.setPictoSize(vm.pictoSizeValue);
            configService.changeBorders(vm.bordersValue);
            configService.setWordPosition(vm.wordPosition);
            configService.setTypeColors(vm.modifiedColors);
            configService.saveConfig();
        }

    }

})();