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

    configService.$inject = ['$window','$translate'];

    function configService($window, $translate) {
        // Default configurations
        var wordStyle = undefined;
        var pictoStyle = undefined;
        // true = top, false = bottom
        var wordPosition = true;
        var borders = true;
        var typeColors = undefined;

        var service = {
            wordStyle: wordStyle,
            setWordFontSize: setWordFontSize,
            pictoStyle: pictoStyle,
            setPictoSize: setPictoSize,
            setPictoGrayscale: setPictoGrayscale,
            wordPosition: wordPosition,
            setWordPosition: setWordPosition,
            changeBorders: changeBorders,
            saveConfig: saveConfig,
            restoreConfig: restoreConfig,
            changeLang: changeLang,
            borders: borders,
            typeColors: typeColors,
            setTypeColors: setTypeColors
        };

        return service;

        ///////////////////////////

        function setTypeColors(newColors) {
            for(var i=0;i<newColors.length;i++) {
                service.typeColors[i] = newColors[i];
            }
        }

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
         * Uses local storage so as to save configuration values.
         */
        function saveConfig() {
            $window.localStorage['wordStyle'] = JSON.stringify(service.wordStyle);
            $window.localStorage['pictoStyle'] = JSON.stringify(service.pictoStyle);
            $window.localStorage['wordPosition'] = service.wordPosition;
            $window.localStorage['coloured'] = service.borders;
            $window.localStorage['typeColors'] = JSON.stringify(service.typeColors);
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

            var defTColors = [{
                'type': 'nombreComun',
                'text': 'Nombre comun',
                'color': 'orange'
            },{
                'type': 'descriptivo',
                'text': 'Descriptivo',
                'color': 'blue'
            },{
                'type': 'verbo',
                'text': 'Verbo',
                'color': 'green'
            },{
                'type': 'miscelanea',
                'text': 'Miscelanea',
                'color': 'white'
            },{
                'type': 'nombrePropio',
                'text': 'Nombre propio',
                'color': 'yellow'
            },{
                'type': 'contenidoSocial',
                'text': 'Contenido social',
                'color': 'white'
            }];
            service.typeColors = JSON.parse($window.localStorage['typeColors'] || JSON.stringify(defTColors));
        }

        /**
         * Changes the selected language
         * @param key = new language {'en', 'es', etc.. }
         */
        function changeLang(key) {
            $translate.use(key);
        }
    }

})();