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
                sett_button_save: 'Guardar por defecto',
                sett_bordersConf: 'Configuración de bordes',
                sett_nombreComun: 'Nombre Comun',
                sett_verbo: 'Verbo',
                sett_contenidoSocial: 'Contenido Social',
                sett_descriptivo: 'Descriptivo',
                sett_nombrePropio: 'Nombre propio',
                sett_miscelanea: 'Miscelanea',
                sett_langConf: 'Idioma del documento',
                acc_title: 'Control de accesos',
                acc_save: 'Guardar documentos',
                acc_load: 'Abrir documentos',
                acc_speech: 'Usar lector',
                acc_social: 'Compartir en redes sociales',
                acc_addPict: 'Añadir pictogramas',
                spl_download: 'Descargando pictogramas',
                spl_unzip: 'Descomprimiendo pictogramas',
                spl_end: 'Completado',
                spl_cont: 'Continuar',
                spl_title: 'Configuración de idioma',
                spl_lang: 'Idioma'
            },
            'en': {
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
                acc_title: 'Access control',
                acc_save: 'Save documents',
                acc_load: 'Open documents',
                acc_speech: 'Text to speech',
                acc_social: 'Share',
                acc_addPict: 'Add pictographs',
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