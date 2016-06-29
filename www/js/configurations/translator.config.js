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
                //common
                com_save: 'Guardar',
                com_cancel: 'Cancelar',
                com_open: 'Abrir',
                com_discard: 'Descartar',
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
                spl_title: 'Configuración inicial',
                spl_lang: 'Idioma',
                spl_dverbs: 'Descargando verbos',
                spl_dpict: 'Descargando pictogramas',
                spl_addpict: 'Añadiendo pictogramas',
                spl_fverbs: 'Conjugaciones',
                // popups
                pu_file: 'Fichero',
                pu_choosepict: 'Elegir picto',
                pu_addpict: 'Añadir picto',
                pu_changetext: 'Cambiar texto',
                pu_pass: 'Introduce la clave',
                pu_saveDocTitle: 'Elige nombre del documento',
                pu_openDocTitle: 'Elige un archivo',
                pu_saveDocQuest: '¿Guardar cambios?',
                pu_insError: 'Error de instalción',
                // admin alert
                adm_title: '¡CUIDADO!',
                adm_message: 'Araword se encuentra en modo administrador, recuerde salir de la aplicación para volver a modo usuario.',
                error_message: 'Error durante la instalción. Es posible que el dispositivo no tenga acceso a internet o capacidad suficiente.'
                + 'Si el problema persiste intente reinstalar la aplicación.',
                send_awd: 'Enviado desde Araword.',
                send_awd_c: 'Documento Araword.',
                upd_title: 'Actualizar conjugaciones',
                sett_prev: 'Previsualización',
                com_pass: 'Clave',
                com_type: 'Tipo',
                com_word: 'Palabra',
                sett_tts: 'Velocidad de lectura'
            },
            'en': {
                com_cancel: 'Cancel',
                com_save: 'Save',
                com_open: 'Open',
                com_discard: 'Discard',
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
                spl_title: 'Initial configuration',
                spl_lang: 'Language',
                spl_dverbs: 'Downloading verbs',
                spl_dpict: 'Downloading pictographs',
                spl_addpict: 'Adding pictographs',
                spl_fverbs: 'Formed verbs',
                // popups
                pu_file: 'File',
                pu_choosepict: 'Choose picto',
                pu_addpict: 'Add picto',
                pu_changetext: 'Change text',
                pu_pass: 'Enter a password',
                pu_saveDocTitle: 'Set document name',
                pu_openDocTitle: 'Choose a file',
                pu_saveDocQuest: 'Save changes?',
                pu_insError: 'Installation error',
                // admin alert
                adm_title: 'WARNING!',
                adm_message: 'Now you are in admin mode, rememeber to restart the app so as to come back user mode.',
                error_message: 'An unexpected error ocurred. Your device may not be connected to the internet or may not have enough storage space.'
                + 'If the problem persists try to reinstall the application.',
                send_awd: 'Sent from Araword.',
                send_awd_c: 'Araword document.',
                upd_title: 'Update formed verbs',
                sett_prev: 'Pictograph preview',
                com_pass: 'Password',
                com_type: 'Type',
                com_word: 'Word',
                sett_tts: 'Voice rate'
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