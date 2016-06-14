/**
 * Created by diego on 17/02/16.
 *
 * Manages procedures related to pictos like database unzipping or download new pictos
 */

(function () {
    'use strict';

    angular
        .module('AraWord')
        .factory('pictUpdater', pictUpdater);

    pictUpdater.$inject = ['$cordovaFile', '$q', '$window', 'configService', '$http', 'araworddb', '$timeout'];

    function pictUpdater($cordovaFile, $q, $window, configService, $http, araworddb, $timeout) {

        var pictosPath = undefined;

        document.addEventListener('deviceready', function() {
            pictosPath = cordova.file.dataDirectory + 'pictos/';
        });

        var server = "http://192.168.0.129:3000";

        var service = {
            getVerbs: getVerbs,
            unzip: unzip,
            downloadPictos: downloadPictos,
            updatePictos: updatePictos,
            getVerbsLangs: getVerbsLangs,
            getSupportedLangs: getSupportedLangs
        };

        return service;

        /////////////////////////////////

        function download(deferred, path) {
            var fileTransfer = new FileTransfer();
            fileTransfer.onprogress = function(progress) {
                deferred.notify(progress);
            };
            var uri = encodeURI(server + path);
            $cordovaFile.checkDir(cordova.file.dataDirectory, 'pictos')
                .then(function(succ) {
                    fileTransfer.download(
                        uri,
                        pictosPath + 'update.zip',
                        function (entry) {
                            $window.localStorage['lastUpdate'] = new Date();
                            deferred.resolve();

                        },
                        function (error) {
                            deferred.reject(error);
                            console.log("download error source " + error.source);
                            console.log("download error target " + error.target);
                            console.log("upload error code" + error.code);
                        },
                        true
                    );
                }, function (err) {
                   $cordovaFile.createDir(cordova.file.dataDirectory,'pictos')
                       .then(function(succ) {
                           fileTransfer.download(
                               uri,
                               pictosPath + 'update.zip',
                               function (entry) {
                                   console.log('Downloaded on ' + entry.toURL());
                                   $window.localStorage['lastUpdate'] = new Date();
                                   deferred.resolve();
                               },
                               function (error) {
                                   deferred.reject(error);
                                   console.log("download error source " + error.source);
                                   console.log("download error target " + error.target);
                                   console.log("upload error code" + error.code);
                               },
                               true
                           );
                       }, function (err) {
                           deferred.reject('FOLDER_EXISTS');
                       });
                });

        }

        function downloadPictos() {
            var deferred = $q.defer();
            if (!$window.localStorage['lastUpdate']) {
                download(deferred, '/pictos/download');
            } else {
                download(deferred, "/pictos/download?date=" +
                    $window.localStorage['lastUpdate']);
            }
            return deferred.promise;
        }

        function updatePictos() {
            var deferred = $q.defer();
            $cordovaFile.readAsText(pictosPath, 'images.xml')
                .then(function (xml) {
                    parseXML(xml,deferred)
                        .then(function() {
                            deferred.resolve()
                        }, function(err) {
                            deferred.reject(err)
                        })
                }, function (err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        function getVerbs(langs) {
            var promises = [];
            var deferred = $q.defer();
            configService.configuration.supportedLangs = [];

            langs.forEach(function (lang, ind) {
                configService.configuration.supportedLangs.push(lang.name);
                promises.push($q(function (resolve, reject) {
                    var fileTransfer = new FileTransfer();
                    fileTransfer.onprogress = function(progress) {
                      deferred.notify(progress);
                    };
                    var uri = encodeURI(server + "/verbs/" + lang.name);
                    fileTransfer.download(
                        uri,
                        cordova.file.applicationStorageDirectory + 'databases/' + lang.name + '_database.db',
                        function () {
                            resolve();
                        },
                        function (error) {
                            reject();
                            console.log("download error source " + error.source);
                            console.log("download error target " + error.target);
                            console.log("upload error code" + error.code);
                        },
                        true
                    );
                }))
            });

            $q.all(promises).then(function () {
                deferred.resolve()
            }, function () {
                deferred.reject()
            });

            return deferred.promise;

        }

        /**
         * Tries to unzip the picto database, if pictos are already unzipped
         * does nothing.
         * @param progressCallback {{ callback executed each progress event }}
         * @returns {promise}
         */
        function unzip() {

            var deferred = $q.defer();

                document.addEventListener('deviceready', unzipHandler, false);

                function unzipHandler() {

                    zip.unzip(pictosPath + 'update.zip',
                        pictosPath,
                        function (result) {
                            if (result!=0) {
                                deferred.reject(result);
                            }
                            deferred.resolve(result);
                        }, function(progress) {
                            deferred.notify({
                                "lengthComputable": true,
                                "loaded": progress.loaded,
                                "total": progress.total})
                        });

                }

            return deferred.promise;
        }

        function parseXML(xml, rootDeferred) {
            var deferred = $q.defer();
            var db = new X2JS().xml_str2json(xml).database;
            var images = db.image;
            var langs = db.languages;
            if (angular.isArray(langs.language)) {
                console.log(JSON.stringify(langs.language));
                araworddb.addLanguagesBulk(langs.language);
            } else {
                araworddb.addLanguagesBulk([langs.language]);
            }
            if (angular.isArray(images)) {
                images.forEach(function(image) {
                    addImage(image);
                });
                araworddb.executeBulk(rootDeferred)
                    .then(deferred.resolve, deferred.reject);
            } else {
                addImage(images);
                araworddb.executeBulk(rootDeferred)
                    .then(deferred.resolve, deferred.reject);s
            }

            return deferred.promise;
        }

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

        function addLanguage(lang, picto) {
            if (angular.isArray(lang.word)) {
                lang.word.forEach(function(word) {
                    addWord(word, picto);
                })
            } else {
                araworddb.addPictoBulk(lang.word, picto);
            }
        }

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

        function getVerbsLangs() {
            return $http({
                'method': 'get',
                'url': 'http://192.168.0.129:3000/verbs/list'
            })
        }

        function getSupportedLangs() {
            return $http({
                'method': 'get',
                'url': 'http://192.168.0.129:3000/pictos/list'
            })
        }

    }
})();
