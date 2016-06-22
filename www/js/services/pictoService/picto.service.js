/**
 * Created by diego on 17/06/16.
 *
 * It manages all the operations related to pictographs and words related to them.
 * It allows to add, download, update one pictograph or the whole set. It also allows
 * to download the formed verbs databases.
 */
(function () {

    'use strict';

    angular
        .module('AraWord')
        .factory('pictoService', pictoService);

    pictoService.$inject = ['$window', '$q', '$cordovaFile', 'configService', 'serverService', 'parserService'];

    /**
     * Pictograph Factory
     * @param $window - Required to acces local storage (where last update date is saved)
     * @param $q - Requided to manage promises
     * @param $cordovaFile - Required to read XML file and clean files
     * @param configService - Required to know document language (add new pictographs)
     * @param serverService - Required to connect with the server
     * @param parserService - Required to parse XML files delivered by the server
     * @returns {Object} - All the operations required to use the service
     */
    function pictoService($window, $q, $cordovaFile, configService, serverService, parserService) {

        var loadingBar = null;
        var verbsProgress = {};

        var service = {
            'pictoPath': null,
            'databasePath': null,
            'addPicto': addPicto,
            'updatePictos': updatePictos,
            'downloadVerbsDB': downloadVerbsDB,
            'getSupportedLangs': getSupportedLangs
        };

        // Deviceready required to access cordova.file.*
        document.addEventListener('deviceready', function() {
            service.pictoPath = cordova.file.dataDirectory + 'pictos/';
            service.databasePath = cordova.file.applicationStorageDirectory + 'databases/';
        });

        return service;

        /////////////////////////////////////////

        /**
         * Adds a new pictograph to the avaliable pictographs set.
         *
         * @param picto - Information about the new pictograph.
         * @param {String} picto.fileName - The file name of the pictograph.
         * @param {String} picto.oldPath - The path were the pictograph can be located.
         * @param {String} picto.type - Pictograph's type.
         * @param {String} picto.lang - Pictograph's language.
         * @param {String} picto.word - The word linked with the pictograph.
         * @returns {Promise} - A promise that will be resolved if the picto is correctly added or rejected in any other case.
         */
        function addPicto(picto) {
            var deferred = $q.defer();

            // If no language has been selected then document language is used.
            if (!picto.lang) picto.lang = configService.configuration.docLang;
            picto.lang = getLangId(picto.lang);
            if (!picto.fileName) deferred.reject('NO_FILENAME');
            // If no type has been selected then Miscelanea is used
            if (!picto.type) picto.type = 3;
            if (!picto.word) deferred.reject('NO_WORD');
            if (!picto.oldPath) deferred.reject('NO_PATH');

            var options = {
                'imageDataType': ImageResizer.IMAGE_DATA_TYPE_URL,
                'format': null,
                'directory': service.pictoPath,
                'filename': picto.fileName,
                'storeImage': true,
                'resizeType': ImageResizer.RESIZE_TYPE_MAX_PIXEL
            };

            // Just .png & .jpg formats supported
            if (picto.fileName.substr(picto.fileName.lastIndexOf('.')) == 'png') {
                options.format = ImageResizer.FORMAT_PNG;
            } else {
                options.format = ImageResizer.FORMAT_JPG;
            }

            // Resizing the image allow us to reduce render time
            $window.imageResizer.resizeImage(
                function(data) {
                    araworddb.newPicto(picto.word, picto)
                        .then(function() {
                            deferred.resolve(data);
                        }, deferred.reject);
                },
                deferred.reject,
                picto.oldPath + '/' + picto.fileName,
                0, 512, options);

            return deferred.promise;
        }


        /**
         * It updates the pictograph set by downloading new pictographs avilable in the picto-server.
         * Every function along the chain should reject a JSON object with error.code at least. This error code
         * will be shown in the error popup so it must be readable.
         * @param bar - Refers to the model associated with a $ionicLoading popup. Used to show progress and block user interaction.
         * @returns {Promise} - Resolved if update goes well, otherwise rejected.
         */
        function updatePictos(bar) {
            loadingBar = bar;
            var deferred = $q.defer();

            // If an error is catched in any point, execution  goes through errorCallback until the last deferred.reject
            // TODO: Smarter way to catch errors without including try/catch inside functions
            createFolder()
                .then(downloadPictos, errorCallback, progressCallback)
                .catch(errorCallback)
                .then(unzipPictos, errorCallback, progressCallback)
                .catch(errorCallback)
                .then(pictos2db, errorCallback, progressCallback)
                .catch(errorCallback)
                .then(clean, errorCallback, progressCallback)
                .catch(errorCallback)
                .then(deferred.resolve, deferred.reject);

            return deferred.promise;

            /**
             * Error callback, rejects the promise.
             * @param error - The error that has triggered this callback
             * @returns {Promise} - Rejected promise.
             */
            function errorCallback(error) {
                // Returning rejected promise broadcasts the error
                // along the whole chain
                return $q.reject(error);
            }

            /**
             * Updates the loading bar values when progress
             * @param progressEvent - The status of an asynchronous task
             * @param progressEvent.lengthComputable - True if current status can be calculated
             * @param progressEvent.total - Total work to be done (numeric)
             * @param progressEvent.loaded - Work currently done.
             */
            function progressCallback(progressEvent) {
                if (progressEvent) {
                    if (progressEvent && progressEvent.lengthComputable) {
                        updateBar($window.Math.round(progressEvent.loaded*100 / progressEvent.total));
                    }
                }
            }
        }

        /**
         * Removes temporary files created during update process
         * @returns {Promise} - Resolved if all the files has been cleaned, otherwise rejected.
         */
        function clean() {
            var deferred = $q.defer();
            $cordovaFile.removeFile(service.pictoPath, 'update.zip')
                .then(function() {
                    $cordovaFile.removeFile(service.pictoPath,'images.xml')
                        .then(deferred.resolve, function(err) {
                            deferred.reject({
                                'error': err,
                                'code': 'CANNOT_CLEAN_IMAGES_XML'
                            })
                        })
                }, function(err) {
                    deferred.reject({
                        'error': err,
                        'code': 'CANNOT_CLEAN_UPDATE_ZIP'
                    })
                });
            return deferred.promise;
        }

        /**
         * Updates the loading bar values
         * @param value - Numeric progress %
         * @param message - Loading bar title
         * @param code - Translator code
         */
        function updateBar(value, message, code) {
            if(angular.isDefined(value)) loadingBar.value = value;
            if(message) loadingBar.message = message;
            if(code) loadingBar.code = code;
        }

        /**
         * Creates the pictograph folder if it has not been created
         * previously
         *
         * @returns {Promise} - Resolved if the folder exists or has been created, otherwise rejected.
         */
        function createFolder() {
            var deferred = $q.defer();
            $cordovaFile.checkDir(cordova.file.dataDirectory,'pictos')
                .then(deferred.resolve, function() {
                    $cordovaFile.createDir(cordova.file.dataDirectory, 'pictos')
                        .then(deferred.resolve, function(error) {
                            deferred.reject({
                                'code': 'CANNOT_CREATE_DIR',
                                'error': error
                            })
                        })
                });
            return deferred.promise;
        }

        /**
         * Downloads the required pictographs to the pictos folder.
         * @returns {Promise} - Resolved if downloaded successfully, otherwise rejected.
         */
        function downloadPictos() {
            updateBar(0,'Downloading pictographs','dpict');
            var date = $window.localStorage.getItem('lastUpdate');
            if (date) {
                return serverService.download('/pictos/download?date='+date, service.pictoPath + 'update.zip', updateDate);
            } else {
                return serverService.download('/pictos/download', service.pictoPath + 'update.zip', updateDate);
            }

            /**
             * Updates last pictographs version
             */
            function updateDate() {
                var date = new Date();
                                                                // Date to GTM+0
                $window.localStorage.setItem('lastUpdate',new Date(date.valueOf() + date.getTimezoneOffset() * 60000));
            }
        }

        /**
         * Unzips the update.zip file located into /pictos folder
         * @returns {Promise} - Resolved if
         */
        function unzipPictos() {
            updateBar(0,'Unzipping pictographs','unzip');
            var deferred = $q.defer();
            document.addEventListener('deviceready', unzipHandler, false);

            function unzipHandler() {
                zip.unzip(service.pictoPath + 'update.zip',
                    service.pictoPath,
                    function (result) {
                        if (result!=0) {
                            deferred.reject({
                                'code': 'CANNOT_UNZIP',
                                'error': result
                            });
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

        /**
         * Parses the images.xml received from the server and adds
         * the pictographs to the local database.
         * @returns {Promise} - Resolved if pictographs have been added, otherwise rejected.
         */
        function pictos2db() {
            updateBar(0,'Adding pictographs', 'addpict');
            var deferred = $q.defer();
            $cordovaFile.readAsText(service.pictoPath, 'images.xml')
                .then(function (xml) {
                    parserService.xml2db(xml,deferred)
                        .then(function() {
                            deferred.resolve()
                        }, function(err) {
                            deferred.reject(err)
                        })
                }, function (err) {
                    deferred.reject({
                        'code': 'CANNOT_READ_IMAGES_XML',
                        'error': err
                    });
                });

            return deferred.promise;
        }

        /**
         * Return the correct idL from the given language code
         * @param {String} lang - The language code
         * @returns {number} The language id
         */
        function getLangId(lang) {
            var langCode = ['es', 'en', 'fr', 'cat', 'it', 'ger', 'pt', 'br', 'gal', 'eus'];
            return langCode.indexOf(lang);
        }

        /**
         * Downloads all the databases of formed verbs which are in langs.
         * @param {Array} langs - All the languages to be downloaded
         * @param {Object} bar - Refers to the model associated with a $ionicLoading popup. Used to show progress and block user interaction.
         * @returns {Promise} - Resolved if download goes well, otherwise rejected.
         */
        function downloadVerbsDB(langs, bar) {
            loadingBar = bar;
            updateBar(0,'Downloading verbs','dverbs');
            var promises = [];
            var deferred = $q.defer();

            langs.forEach(function (lang) {
                verbsProgress[lang.code] = {};
                promises.push(serverService.download(
                    '/verbs/'+lang.code,
                    service.databasePath + lang.code + '_database.db',
                    null,
                    function(progress) {
                        notify(progress, lang.code)
                    })
                );
            });

            $q.all(promises).then(function () {
                deferred.resolve()
            }, function (error) {
                deferred.reject(error)
            });

            return deferred.promise;
        }

        /**
         * Calulates the whole download progress by combining any single download progress.
         * @param deferred - Promise to be notified when progress event occurs
         * @param progress - Single progress structure
         * @param lang - Identifies the download which has notified.
         */
        function notify(progress, lang) {
            if (!verbsProgress[lang].total) verbsProgress[lang].total = progress.total;
            verbsProgress[lang].loaded = progress.loaded;
            var total = 0, loaded = 0;
            angular.forEach(verbsProgress, function(value) {
                total += value.total;
                loaded += value.loaded;
            });
            updateBar($window.Math.round(loaded*100/total));
        }

        /**
         * Queries the server to obtain all the information about the languages supported
         * @returns {Object} - An object with mainLangs[] and verbLangs[]
         */
        function getSupportedLangs() {
            var deferred = $q.defer();
            var mainLangs = [], verbLangs = [];
            serverService.query('/languages')
                .then(function (langs) {
                    langs.forEach(function (lang, ind) {
                        var newLang = {
                            'id': ind,
                            'locale': lang.locale,
                            'long': lang.long,
                            'code': lang.code,
                            'haveVerbs': lang.haveVerbs
                        };
                        mainLangs.push(newLang);
                        if (lang.haveVerbs) {
                            verbLangs.push(newLang);
                        }
                    });
                    deferred.resolve({
                        'mainLangs': mainLangs,
                        'verbLangs': verbLangs
                    });
                }, deferred.reject);
            return deferred.promise;
        }
    }

})();