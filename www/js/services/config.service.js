/**
 * Created by diego on 2/03/16.
 *
 * Manages the whole app configurations.
 * Uses localStorage to make config persistent.
 */

(function() {

    'use strict';

    angular
        .module('AraWord')
        .factory('configService', configService);

    configService.$inject = ['$window'];

    function configService($window) {
        // Default configurations
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

        ///////////////////////////

        /**
         * Changes font size.
         * @param newSize = new font size.
         */
        function setWordFontSize(newSize) {
            service.wordStyle['fontSize'] = newSize+'px';
        }

        /**
         * Changes pictographs size
         * @param newSize = new pictographs size
         */
        function setPictoSize(newSize) {
            service.pictoStyle['width'] = newSize+'px';
            service.wordStyle['min-width'] = newSize+'px';
        }

        /**
         * Changes gray scale
         * @param newGrayscale = new gray scale value.
         */
        function setPictoGrayscale(newGrayscale) {
            service.pictoStyle['-webkit-filter'] = 'grayscale('+newGrayscale+'%)';
        }

        /**
         * Changes text position; under/over the pictograph
         * @param newPosition = new text position
         */
        function setWordPosition(newPosition) {
            service.wordPosition = newPosition;
        }

        /**
         * Changes borders value; true/false
         * @param newValue If true the borders will be shown, otherwise not.
         */
        function changeBorders(newValue) {
            service.borders = newValue;
        }

        /**
         * If service.borders is false it returns white borders
         * @param word = The word whose border must be set
         * @returns {{border: string}} Siv style with the correct border configuration.
         */
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

        /**
         * Uses local storage so as to save configuration values.
         */
        function saveConfig() {
            $window.localStorage['wordStyle'] = JSON.stringify(service.wordStyle);
            $window.localStorage['pictoStyle'] = JSON.stringify(service.pictoStyle);
            $window.localStorage['wordPosition'] = service.wordPosition;
            $window.localStorage['coloured'] = service.borders;
        }

        /**
         * Restores configuration values from local storage, if any value it's not
         * found it uses default values.
         */
        function restoreConfig() {
            var defWStyle = { 'fontSize': '24px', 'min-width': '100px' };
            // We cannot parse native so stringify required
            service.wordStyle = JSON.parse($window.localStorage['wordStyle'] || JSON.stringify(defWStyle));

            var defPStyle = { 'width': '100px', '-webkit-filter': 'grayscale(0%)' };

            // We cannot parse native so stringify required
            service.pictoStyle = JSON.parse($window.localStorage['pictoStyle'] || JSON.stringify(defPStyle));

            // Local storage saves Strings not booleans...
            service.wordPosition = ($window.localStorage['wordPosition'] || "true") == "true";
            service.borders = ($window.localStorage['coloured'] || "true") == "true";
        }
    }

})();