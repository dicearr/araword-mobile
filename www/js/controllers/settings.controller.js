/**
 * Created by diego on 29/02/16.
 */
(function() {

    'use strict';

    angular
        .module('app')
        .controller('settingsController', settingsController);

    settingsController.$inject = ['configService'];

    function settingsController(configService) {

        var vm = this;

        var pictoStyle = configService.pictoStyle;
        var wordStyle = configService.wordStyle;

        vm.setGrayValue = setGrayValue;
        // We need numeric value to ng-model
        vm.grayValue = pictoStyle['-webkit-filter']
            .substring(10,pictoStyle['-webkit-filter'].indexOf('%'));
        vm.grayStyle = {
            '-webkit-filter': 'grayscale('+vm.grayValue+'%)'
        };

        vm.setPictoSizeValue = setPictoSizeValue;
        // We need numeric value to ng-model
        vm.pictoSizeValue = pictoStyle['width']
            .substring(0,pictoStyle['width'].indexOf('p'));
        vm.pictoStyle = {
            'width': vm.pictoSizeValue + 'px'
        };

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

        ///////////

        function setGrayValue() {
          vm.grayStyle = {
            '-webkit-filter': 'grayscale('+vm.grayValue+'%)'
          };
        }

        function setPictoSizeValue() {
            vm.pictoStyle = {
                'width': vm.pictoSizeValue + 'px'
            };
        }

        function setFontSizeValue() {
            vm.fontStyle = {
                'fontSize': vm.fontSizeValue + 'px'
            };
        }

        function saveConfig() {
            configService.setWordFontSize(vm.fontSizeValue);
            configService.setPictoGrayscale(vm.grayValue);
            configService.setPictoSize(vm.pictoSizeValue);
            configService.changeBorders(vm.bordersValue);
            configService.setWordPosition(vm.wordPosition);
            configService.saveConfig();
        }

    }

})();