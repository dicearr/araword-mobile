/**
 * Created by Diego on 7/03/16.
 *
 * Manages the translations by using:
 *  https://angular-translate.github.io/
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
                // templates/settings.html
                sett_pictSize: 'Tamaño de pictograma',
                sett_fontSize: 'Tamaño de letra',
                sett_grayScale: 'Escala de grises',
                sett_borders: 'Bordes de colores',
                sett_position: 'Texto debajo',
                sett_button_save: 'Guardar por defecto',
                sett_bordersConf: 'Configuración de bordes',
                sett_nombreComun: 'Nombre Comun',
                sett_verbo: 'Verbo',
                sett_contenidoSocial: 'Contenido Social',
                sett_descriptivo: 'Descriptivo',
                sett_nombrePropio: 'Nombre propio',
                sett_miscelanea: 'Miscelanea',
                sett_langConf: 'Idioma del documento',
                // templates/access.html
                acc_title: 'Control de accesos',
                acc_toSave: 'Guardar documentos',
                acc_toLoad: 'Abrir documentos',
                acc_toSpeech: 'Usar lector',
                acc_toShare: 'Compartir en redes sociales',
                acc_toAdd: 'Añadir pictogramas',
                // templates/splash.html
                spl_download: 'Descargando pictogramas',
                spl_unzip: 'Descomprimiendo pictogramas',
                spl_end: 'Completado',
                spl_cont: 'Continuar',
                spl_title: 'Configuración de idioma',
                spl_lang: 'Idioma'
            },
            'en': {
                // templates/settings.html
                sett_pictSize: 'Pictograph size',
                sett_fontSize: 'Font size',
                sett_grayScale: 'Gray scale value',
                sett_borders: 'Coloured borders',
                sett_position: 'Text under pictograph',
                sett_button_save: 'Save as default',
                sett_bordersConf: 'Borders configuration',
                sett_nombreComun: 'Common name',
                sett_verbo: 'Verb',
                sett_contenidoSocial: 'Social content',
                sett_descriptivo: 'Descriptive',
                sett_nombrePropio: 'Own name',
                sett_miscelanea: 'Miscellany',
                sett_langConf: 'Document language',
                // templates/access.html
                acc_title: 'Access control',
                acc_toSave: 'Save documents',
                acc_toLoad: 'Open documents',
                acc_toSpeech: 'Text to speech',
                acc_toShare: 'Share',
                acc_toAdd: 'Add pictographs',
                // templates/splash.html
                spl_download: 'Downloading pictographs',
                spl_unzip: 'Unzipping pictographs',
                spl_end: 'Completed',
                spl_cont: 'Continue',
                spl_title: 'Language configuration',
                spl_lang: 'Language'
            }
        };

        var langs = ['es','en'];

        langs.forEach(function(lang) {
            $translateProvider.translations(lang, translations[lang]);
        });

        // Our app gets the system lang so as to translate itself
        var sysLang = navigator.systemLanguage || navigator.language  || navigator.userLanguage;
        sysLang = sysLang.split('-')[0];

        if (langs.indexOf(sysLang)>-1) {
            $translateProvider.preferredLanguage(sysLang);
        } else {
            // In case the sys lang is not available, spanish will be selected
            $translateProvider.preferredLanguage('es');
        }

    }
})();