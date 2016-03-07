/**
 * Created by diego on 7/03/16.
 */

(function() {
    'use strict';

    angular
        .module('AraWord')
        .config(translator);

    translator.$inject = ['$translateProvider'];

    function translator($translateProvider) {

        $translateProvider.useSanitizeValueStrategy('sanitize');

        var translations = {
            'es': {
                sett_pictSize: 'Tamaño de pictograma',
                sett_fontSize: 'Tamaño de letra',
                sett_grayScale: 'Escala de grises',
                sett_borders: 'Bordes de colores',
                sett_position: 'Texto debajo',
                sett_button_save: 'Guardar por defecto'
            },
            'en': {
                sett_pictSize: 'Pictograph size',
                sett_fontSize: 'Font size',
                sett_grayScale: 'Gray scale value',
                sett_borders: 'Coloured borders',
                sett_position: 'Text under pictograph',
                sett_button_save: 'Save as default'
            }
        };

        var langs = ['es','en'];

        langs.forEach(function(lang) {
            $translateProvider.translations(lang, translations[lang]);
        });

        $translateProvider.preferredLanguage('en');
    }
})();