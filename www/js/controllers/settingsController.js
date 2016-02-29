/**
 * Created by diego on 29/02/16.
 */
(function() {

    'use strict';

    angular
        .module('app')
        .controller('settingsController', settingsController);

    settingsController.$inject = [];

    function settingsController() {

        var vm = this;

        vm.setGrayValue = setGrayValue;
        vm.grayValue = 0;
        vm.grayStyle = {
            '-webkit-filter': 'grayscale(100%)'
        };

        vm.setPictoSizeValue = setPictoSizeValue;
        vm.pictoSizeValue = 100;
        vm.pictoStyle = {
            'width': vm.pictoSizeValue + 'px'
        };

        vm.setFontSizeValue = setFontSizeValue;
        vm.fontSizeValue = 24;
        vm.fontStyle = {
            'font-size': vm.fontSizeValue + 'px'
        };

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
                'font-size': vm.fontSizeValue + 'px'
            };
        }


    }

})();