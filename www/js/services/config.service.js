/**
 * Created by diego on 2/03/16.
 */

(function() {

    'use strict';

    angular
        .module('app')
        .factory('configService', configService);

    configService.$inject = ['$window'];

    function configService($window) {
        var wordStyle = { 'fontSize': '24px', 'min-width': '100px' };
        var pictoStyle = { 'width': '100px', '-webkit-filter': 'grayscale(0%)' };
        // true = top, false = bottom
        var wordPosition = true;
        var borders = true;

        var service = {
            wordStyle: wordStyle,
            setWordFontSize: setWordFontSize,
            pictoStyle: pictoStyle,
            setPictoSize: setPictoSize,
            setPictoGrayscale: setPictoGrayscale,
            wordPosition: wordPosition,
            setWordPosition: setWordPosition,
            getDivStyle: getDivStyle,
            changeBorders: changeBorders,
            saveConfig: saveConfig,
            restoreConfig: restoreConfig,
            borders: borders
        };

        return service;

        ////////////

        function setWordFontSize(newSize) {
            service.wordStyle['fontSize'] = newSize+'px';
        }

        function setPictoSize(newSize) {
            service.pictoStyle['width'] = newSize+'px';
            service.wordStyle['min-width'] = newSize+'px';
        }

        function setPictoGrayscale(newGrayscale) {
            service.pictoStyle['-webkit-filter'] = 'grayscale('+newGrayscale+'%)';
        }

        function setWordPosition(newPosition) {
            service.wordPosition = newPosition;
        }

        function changeBorders(newValue) {
            service.borders = newValue;
        }

        function getDivStyle(word) {

            var color = null;
            if (!service.borders) {
                return {
                    'border': '1px solid white'
                }
            }

            switch (word.pictos[word.pictInd]['type']) {
                case 0:
                    color = 'orange';
                    break;
                case 1:
                    color = 'blue';
                    break;
                case 2:
                    color = 'green';
                    break;
                case 3:
                    color = 'white';
                    break;
                case 4:
                    color = 'yellow';
                    break;
                case 5:
                    color = 'white';
                    break;
            }
            word.divStyle = { 'border': '4px solid '+color };
        }

        function saveConfig() {
            $window.localStorage['wordStyle'] = JSON.stringify(service.wordStyle);
            $window.localStorage['pictoStyle'] = JSON.stringify(service.pictoStyle);
            $window.localStorage['wordPosition'] = service.wordPosition;
            $window.localStorage['coloured'] = service.borders;
        }

        function restoreConfig() {
            var defWStyle = { 'fontSize': '24px', 'min-width': '100px' };
            service.wordStyle = JSON.parse($window.localStorage['wordStyle'] || JSON.stringify(defWStyle));

            var defPStyle = { 'width': '100px', '-webkit-filter': 'grayscale(0%)' };
            service.pictoStyle = JSON.parse($window.localStorage['pictoStyle'] || JSON.stringify(defPStyle));

            // Local storage saves Strings not booleans...
            service.wordPosition = ($window.localStorage['wordPosition'] || "true") == "true";
            service.borders = ($window.localStorage['coloured'] || "true") == "true";
        }
    }

})();