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

    pictUpdater.$inject = ['$cordovaFile', '$q', '$window', 'configService', 'docsService', '$http', '$cordovaFileTransfer', 'araworddb'];

    function pictUpdater($cordovaFile, $q, $window, configService, docsService, $http, $cordovaFileTransfer, araworddb) {

        var pictosPath = undefined;

        document.addEventListener('deviceready', function() {
            pictosPath = cordova.file.dataDirectory + 'pictos/';
        });

        var server = "http://192.168.1.103:3000";

        var service = {
            getVerbs: getVerbs,
            unzip: unzip,
            downloadPictos: downloadPictos,
            updatePictos: updatePictos
        };

        return service;

        /////////////////////////////////

        function download(deferred, path, onProgress) {
            var fileTransfer = new FileTransfer();
            fileTransfer.onprogress = onProgress;
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

        function downloadPictos(onProgress) {
            var deferred = $q.defer();
            if (!$window.localStorage['lastUpdate']) {
                download(deferred, '/pictos/download', onProgress);
            } else {
                download(deferred, "/pictos/download?date=" +
                    $window.localStorage['lastUpdate'], onProgress);
            }
            return deferred.promise;
        }

        function updatePictos() {

            var deferred = $q.defer();

            $cordovaFile.readAsText(pictosPath, 'images.xml')
                .then(function (xml) {
                    parseXML(xml);
                    deferred.resolve();
                }, function (err) {
                    deferred.reject(err);
                });

            return deferred.promise;

        }

        function getVerbs(langs) {
            var promises = [];
            var deferred = $q.defer();
            configService.configuration.supportedLangs = [];

            langs.forEach(function (lang) {
                configService.configuration.supportedLangs.push(lang.name);
                promises.push($q(function (resolve, reject) {
                    var fileTransfer = new FileTransfer();
                    var uri = encodeURI(server + "/verbs/" + lang.name);
                    fileTransfer.download(
                        uri,
                        cordova.file.applicationStorageDirectory + 'databases/' + lang.name + '_database.db',
                        function (entry) {
                            deferred.notify({'lang': lang.name, 'entry': entry.toURL()});
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
        function unzip(progressCallback) {

            return $q(function (resolve, reject) {

                document.addEventListener('deviceready', unzipHandler, false);

                function unzipHandler() {

                    zip.unzip(pictosPath + 'update.zip',
                        pictosPath,
                        function (result) {
                            if (result!=0) {
                                reject(result);
                            }
                            resolve(result);
                        }, progressCallback);

                }
            });
        }


        function parseXML(xml) {
            var x2js = new X2JS();
            var images = x2js.xml_str2json(xml);
            var picto = {};
            var wordVal = '';
            if (!araworddb.ready()) {
                araworddb.startService();
            }
            console.log(JSON.stringify(images));
            if (angular.isArray(images.database.image)) {
                images.database.image.forEach(function (image) {
                    picto.picto = image._name;
                    picto.pictoNN = image._id;
                    picto.lang = deparseLang(image.language._id);
                    if (angular.isArray(image.word)) {
                        image.word.forEach(function (word) {
                            picto.type = parseType(word._type);
                            wordVal = word.__text;
                            araworddb.newPicto(wordVal, picto);
                        })
                    } else {
                        picto.type = parseType(image.word._type);
                        wordVal = image.word.__text;
                        araworddb.newPicto(wordVal, picto);
                    }

                });
            } else {
                picto.picto = images.database.image._name;
                picto.pictoNN = images.database.image._id;
                picto.lang = deparseLang(images.database.image.language._id);
                if (angular.isArray(images.database.image.language.word)) {
                    images.database.image.language.word.forEach(function (word) {
                        picto.type = parseType(word._type);
                        wordVal = word.__text;
                        araworddb.newPicto(wordVal, picto);
                    })
                } else {
                    picto.type = parseType(images.database.image.language.word._type);
                    wordVal = images.database.image.language.word.__text;
                    araworddb.newPicto(wordVal, picto);
                }
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

    };
})();
