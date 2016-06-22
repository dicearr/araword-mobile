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

        // Default configuration
        var configuration = {
            'pictoSize': 100,
            'fontSize': 24,
            'grayScale': 0,
            'borders': true,
            'possition': true,
            'docLang': {
                'code': 'es',
                'locale': 'es-ES',
                'long': 'Castellano'
            },
            'supportedLangs': [{
                'code': 'es',
                'locale': 'es-ES',
                'long': 'Castellano'
            }],
            'typeColors': [{
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
            }]
        };

        var service = {
            configuration: configuration,
            styles: undefined,
            saveConfig: saveConfig,
            restoreConfig: restoreConfig
        };

        return service;

        ///////////////////////////

        /**
         * Uses local storage so as to save configuration values.
         */
        function saveConfig() {
            setStyles();
            $window.localStorage['configuration'] = JSON.stringify(service.configuration);
        }

        /**
         * Restores configuration values from local storage, if any value it's not
         * found it uses default values.
         */
        function restoreConfig() {
            service.configuration = JSON.parse($window.localStorage['configuration'] || JSON.stringify(configuration));
            if (angular.isUndefined(service.configuration['styles'])) {
                setStyles();
            }
        }

        function setStyles() {
            var inputSize = parseInt(service.configuration['fontSize'])+10;
            service.styles = {
                'pictoStyle': {
                    '-webkit-filter': 'grayscale('+ service.configuration['grayScale']+ '\%)',
                    'width': service.configuration['pictoSize'] + 'px'
                },
                'fontStyle': {
                    'fontSize': service.configuration['fontSize'] + 'px'
                },
                'inputStyle': {
                    'height':  inputSize + 'px',
                    'min-width': service.configuration['pictoSize'] + 'px'
                }
            };
        }
    }

})();