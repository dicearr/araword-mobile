/**
 * Created by diego on 17/06/16.
 *
 * Provides all the functions needed to read XML files generated
 * by the pictograph server or any other AraWord App.
 */
(function() {

    'use strict';

    angular
        .module('AraWord')
        .factory('parserService', parserService);

    parserService.$inject = ['$q','araworddb'];

    function parserService($q,araworddb) {

        var service = {
            'xml2db': xml2db
        };

        return service;

        ////////////////////////

        /**
         * Parses the exported DB in XML format to JSON and adds all the
         * new pictographs to the database.
         *
         * @param xml - images.xml read as a string (contains all the information about the new pictographs)
         * @param rootDeferred - promise where notify the progress
         * @returns {Promise} - Resolved if the xml has been correctly imported, otherwise rejected.
         */
        function xml2db(xml, rootDeferred) {
            var deferred = $q.defer();
            var db = new X2JS().xml_str2json(xml).database;
            var images = db.image;
            var langs = db.languages;
            if (angular.isArray(langs.language)) {
                araworddb.addLanguagesBulk(langs.language);
            } else {
                araworddb.addLanguagesBulk([langs.language]);
            }
            if (angular.isArray(images)) {
                images.forEach(function(image) {
                    addImage(image);
                });
                araworddb.executeBulk(rootDeferred)
                    .then(deferred.resolve, function(error) {
                        deferred.reject({
                            'code': 'BULK_FAILED',
                            'error': error
                        })
                    });
            } else {
                // No images to add so nothing to do
                if (!images) { deferred.resolve(); }
                else {
                    addImage(images);
                    araworddb.executeBulk(rootDeferred)
                        .then(deferred.resolve, function(error) {
                            deferred.reject({
                                'code': 'BULK_FAILED',
                                'error': error
                            });
                        });
                }
            }

            return deferred.promise;
        }

        /**
         * Adds all the languages and words related to the image into their structure
         * @param {Object|Array} image - XML parsed <image> tag
         */
        function addImage(image) {
            var picto = {
                "picto": image._name,
                "pictoNN": image._name
            };
            if (angular.isArray(image.language)) {
                image.language.forEach(function(lang) {
                    picto.lang = deparseLang(lang._id);
                    addLanguage(lang, picto);
                })
            } else {
                picto.lang = deparseLang(image.language._id);
                addLanguage(image.language, picto);
            }
        }

        /**
         * Adds all the words into their language structure and generates
         * inputs so as to be executed in the bulk instruction.
         * @param {Object|String} lang - Language structure parsed form images.xml
         * @param {Object} picto - Pictograph information read from images.xml
         */
        function addLanguage(lang, picto) {
            if (angular.isArray(lang.word)) {
                lang.word.forEach(function(word) {
                    addWord(word, picto);
                })
            } else {
                picto.type = parseType('miscelanea');
                araworddb.addPictoBulk(lang.word, picto);
            }
        }

        /**
         * Generates the bulk instruction to add a new word.
         * @param {Object|String} word - The word to be added.
         * @param {Object} picto - Pictograph information.
         */
        function addWord(word, picto) {
            picto.type = parseType(word._type);
            if (word.__text) {
                araworddb.addPictoBulk(word.__text,picto);
            } else {
                araworddb.addPictoBulk(word,picto);
            }
        }

        function deparseLang(lang) {
            var langs = ['Castellano', 'Ingles', 'Frances', 'Catalan', 'Italiano', 'Aleman', 'Portugues', 'Portugues Brasil', 'Gallego', 'Euskera'];
            return langs.indexOf(lang);
        }

        function parseType(typeInText) {
            var types = ['nombreComun', 'descriptivo', 'verbo', 'miscelanea', 'nombrePropio', 'contenidoSocial'];
            var ind = types.indexOf(typeInText);
            return ind >= 0 ? ind : 3;
        }

    }

})();
