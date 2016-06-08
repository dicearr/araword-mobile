/**
 * Created by diego on 5/04/16.
 *
 * Contains all the procedures needed so as to save/restore a document.
 * Documents generated with docs.service will be pc compatible.
 */
(function () {

    'use strict';

    angular
        .module('AraWord')
        .factory('docsService', docsService);

    docsService.$inject = ['$cordovaFile', '$q', 'textAnalyzer', 'configService', '$window', 'verbsdb', 'araworddb'];

    function docsService($cordovaFile, $q, textAnalyzer, configService, $window, verbsdb, araworddb) {

        var docs_default_path = "";
        document.addEventListener('deviceready', function () {
            docs_default_path = cordova.file.externalDataDirectory;
        }, false);

        var empty_picto = {
            'picto': '',
            'type': '3',
            'base64': 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
        };

        var service = {
            getDocsList: getDocsList,
            openDoc: openDoc,
            saveDoc: saveDoc,
            docsPath: docs_default_path
        };

        return service;

        ////////////////

        /**
         * Returns all the files with '.awz' extension inside of /AraWord folder
         * @returns {[Entry]} Entries File objects to work with
         */
        function getDocsList(path) {
            var search_path = path ? path : docs_default_path;
            return listFiles(search_path, sanitizeEntries);

            /**
             * Deletes element which are not AraWord files
             * @param {[Entry]} entries List of entries from directory
             * @param resolve Function resolve from $q
             */
            function sanitizeEntries(entries, resolve) {
                var result = [];
                entries.forEach(function (entry) {
                    if (entry.isFile && isArawordFile(entry.name)) {
                        result.push(entry);
                    }
                });
                resolve(result);

            }

            /**
             * @param {String} fileName File to be checked
             * @returns {boolean} isArawordFile True if has .aw extension
             */
            function isArawordFile(fileName) {
                return (fileName.lastIndexOf('.awz') == (fileName.length - 4));
            }
        }

        /**
         * Loads a document into AraWord
         * @param {String} docPath Path where the document is stored
         * @param {String} docName The documents name
         * @returns {[Promise]}
         */
        function openDoc(docPath, docName) {
            textAnalyzer.docName = docName;
            /**
             * PROCEDURE: Unzip document '.awd'
             *            Read 'base.awd'
             *              For each word
             *                 read 'exportbbdd/images.xml' to get words type
             *                 read 'exportbbdd/[pictoName].png' to get base64
             *                 push new word in textAnalyzer.text
             */
            var path = docPath ? docPath : docs_default_path;
            unzip().then(function () {
                $cordovaFile.readAsText(path, 'base.awd')
                    .then(function (success) {
                        var x2js = new X2JS();
                        var baseaw = x2js.xml_str2json(success);
                        var words = baseaw.document.content.AWElement;

                        configService.configuration.docLang =
                            deparseLang(baseaw.document.preferences.documentLanguage);
                        verbsdb.setLang(configService.configuration.docLang);
                        araworddb.setLang(configService.configuration.docLang);

                        words = words.filter(isWord);

                        var diff = textAnalyzer.text.length - words.length;
                        if (diff > 0) {
                            textAnalyzer.text.splice(words.length, diff);
                        }
                        var i = 0;

                        words.forEach(function (word) {
                            var newWord = {
                                'value': word.word,
                                'pictos': [{
                                    'picto': word.namePicto,
                                    'type': 0,
                                    'base64': empty_picto.base64
                                }, empty_picto],
                                'pictInd': 0,
                                'words': word.word.split(' ').length
                            };

                            if (i != -1 && i < textAnalyzer.text.length) {
                                textAnalyzer.text[i] = newWord;
                                i++;
                            } else {
                                textAnalyzer.text.push(newWord);
                                i = -1;
                            }

                            readPicto(newWord)
                                .then(function (base64) {
                                    newWord.pictos[0].base64 = base64;
                                });

                            getType(newWord)
                                .then(function (type) {
                                    newWord.pictos[0].type = parseType(type);
                                });


                        });

                    });
            });

            /**
             * Checks if a given word is not a separator
             * @param word Word object retrieved from XML base.awd
             * @returns {boolean} True if word is not a separator, otherwise false
             */
            function isWord(word) {
                return word['_type'] != 'separator';
            }

            /**
             * Unzips the .awd file to read its content
             * @returns {Promise}
             */
            function unzip() {
                return $q(function (resolve, reject) {
                    $cordovaFile.removeRecursively(path, 'exportbbdd')
                        .then(function () {
                            internal_unzip(reject, resolve);
                        }, function (err) {
                            if (err.code == 1) {
                                internal_unzip(reject, resolve);
                            } else {
                                console.log(JSON.stringify(err));
                            }
                        });
                });

                function internal_unzip(reject, resolve) {
                    zip.unzip(path + '/' + docName, path, function (code) {
                        if (code != 0) {
                            console.log('error');
                            reject('ERROR');
                        } else {
                            console.log('right');
                            resolve('SUCCESS')
                        }
                    })
                }
            }

            /**
             * Reads a pictograph from .awd unzipped folder
             * @param  word Word object retrieved from XML base.awd
             * @returns {Promise}
             */
            function readPicto(word) {
                var picto = word.pictos[0].picto;
                var pictoPath = path + '/exportbbdd';
                return $cordovaFile.readAsDataURL(pictoPath, picto);
            }

            /**
             * Gets the tipe from a given pictograph
             * @param word Word object retrieved from XML base.awd
             * @returns {Promise}
             */
            function getType(word) {
                return $q(function (resolve) {
                    if (angular.isUndefined(word.pictos[word.pictInd].picto)) {
                        resolve('miscelanea');
                    } else {
                        var my_path = path + '/exportbbdd';
                        $cordovaFile.readAsText(my_path, 'images.xml')
                            .then(function (success) {
                                var x2js = new X2JS();
                                var images = x2js.xml_str2json(success).database.image;
                                images.some(function (image) {
                                    if (image['_id'] == word.pictos[word.pictInd].picto) {
                                        resolve(image.language.word['_type'])
                                        return true;
                                    } else {
                                        return false;
                                    }
                                })
                            })
                    }

                })
            }

        }

        /**
         * Allows user to save Documents into /AraWord folder
         * @param text The text to be saved
         * @param docPath The path in with the document will be saved, if null ile:///storage/emulated/0/AraWord
         * @param name The documents name
         */
        function saveDoc(text, docPath, name) {
            if (text.length > 0) {
                var path = docPath ? docPath : docs_default_path;
                var zip = new JSZip();

                // Create zip structure
                zip.folder('exportbbdd');
                text.forEach(function (word) {
                    var picto = word.pictos[word.pictInd];
                    zip.file('exportbbdd/' + picto.picto, picto.base64.substr(picto.base64.indexOf(',') + 1), {base64: true})
                });
                var imageXML = getImagesXml();
                zip.file('exportbbdd/images.xml', imageXML);
                var baseXML = getBaseXml();
                zip.file('base.awd', baseXML);
                var content = zip.generate({type: "blob"});

                return $cordovaFile.writeFile(path, name + '.awz', content, true);
            }

            /**
             * @returns {String} images.xml XML file with the documents images information
             */
            function getImagesXml() {
                var result = {
                    "database": {
                        "languages": {
                            "language": {
                                "__text": "Castellano"
                            }
                        },
                        "image": []
                    }
                };

                text.forEach(function (word) {
                    var picto = word.pictos[word.pictInd];
                    result.database.image.push({
                        "language": {
                            "_id": "Castellano",
                            "word": {
                                "_type": deparseType(picto.type),
                                "__text": word.value
                            }
                        },
                        "_id": picto.picto
                    });
                });

                var x2js = new X2JS();
                var imagesXML = x2js.json2xml_str(result);

                return imagesXML;
            }

            /**
             * @returns {String} base.awd XML string with the documents information
             */
            function getBaseXml() {
                var result = {
                    "document": {
                        "preferences": {
                            "documentLanguage": parseLang(configService.configuration.docLang),
                            "imageSize": 100,
                            "font": {
                                "name": "Verdana",
                                "size": 14,
                                "bold": "yes"
                            },
                            "color": {
                                "r": 0,
                                "g": 0,
                                "b": 0
                            },
                            "textBlowPictogram": configService.configuration.position ? "yes" : "no"
                        },
                        "content": {
                            "AWElement": []
                        }
                    }
                };

                text.forEach(function (word) {
                    result.document.content.AWElement.push({
                        "_type": "pictogram",
                        "word": word.value,
                        "namePicto": word.pictos[word.pictInd].picto
                    });
                    result.document.content.AWElement.push({
                        "_type": "separator",
                        "__text": "ws"
                    })
                });

                var x2js = new X2JS();
                var baseXML = x2js.json2xml_str(result);

                return baseXML;

            }

        }

        /**
         * Lists all the files inside of a given path and executes a callback in success.
         * @param {String} search_path Path in with search files.
         * @param {Function} callback Function to be executed in success.
         * @returns {Promise}
         */
        function listFiles(search_path, callback) {
            return $q(function (resolve, reject) {
                $window.resolveLocalFileSystemURL(search_path,
                    function (fileSystem) {
                        var reader = fileSystem.createReader();
                        reader.readEntries(function (success) {
                                callback(success, resolve);
                            },
                            function (err) {
                                reject(err);
                            }
                        );
                    }, function (err) {
                        reject(err);
                    }
                );
            });
        }
    }

    /**
     * @param typeInText = { nombreComun, descriptivo, verbo, miscelanea, nombrePropio, contenidoSocial }
     * @returns {number} = Returns a unique identifier for each type of word.
     */
    function parseType(typeInText) {
        var types = ['nombreComun', 'descriptivo', 'verbo', 'miscelanea', 'nombrePropio', 'contenidoSocial'];
        var ind = types.indexOf(typeInText);
        return ind >= 0 ? ind : 3;
    }

    function deparseType(typeN) {
        var types = ['nombreComun', 'descriptivo', 'verbo', 'miscelanea', 'nombrePropio', 'contenidoSocial'];
        return typeN >= types.length ? types[3] : types[typeN];
    }

    function deparseLang(lang) {
        var langs = ['Castellano', 'Ingles', 'Frances', 'Catalan', 'Italiano', 'Aleman', 'Portugues', 'Portugues Brasil', 'Gallego', 'Euskera'];
        var langCode = ['es', 'en', 'fr', 'cat', 'it', 'ger', 'pt', 'br', 'gal', 'eus'];
        return langCode[langs.indexOf(lang)];
    }

    function parseLang(lang) {
        var langs = ['Castellano', 'Ingles', 'Frances', 'Catalan', 'Italiano', 'Aleman', 'Portugues', 'Portugues Brasil', 'Gallego', 'Euskera'];
        var langCode = ['es', 'en', 'fr', 'cat', 'it', 'ger', 'pt', 'br', 'gal', 'eus'];
        return langs[langCode.indexOf(lang)];
    }

})
();