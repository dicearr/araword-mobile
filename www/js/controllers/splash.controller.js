/**
 * Created by Diego on 11/03/16.
 *
 * Manages the initial screen where pictures are downloaded and unzipped.
 * Also, language configuration and password are settled here.
 */

(function() {
    'use strict';

    angular
        .module('AraWord')
        .controller('splashController',splashController);

    splashController.$inject = ['pictUpdater','$ionicLoading', '$location',
            '$ionicPopup', '$window', '$scope', '$q', 'araworddb', 'configService', 'popupsService', '$interval'];

    function splashController(pictUpdater, $ionicLoading, $location,
                              $ionicPopup, $window, $scope, $q, araworddb,
                              configService, popupsService, $interval) {


        var vm = this;
        var initialPopup = undefined;
        vm.bar = {
            'code': 'download',
            'message':'Downloading pictographs',
            'value': 0
        };

        vm.langSelect = {
            'langs': [],
            'selected': undefined
        };

        vm.verbsSelect = {
            'langs': [],
            'selected': []
        };

        if (firstTime()) {
            getVerbsLangs()
                .then(getLangs, errorCallback)
                .then(createDB, errorCallback)
                .then(showPopup, errorCallback);

        } else {
            $location.path('/text');
        }

        /////////////////////////////

        function showPopup() {
            initialPopup = {
                templateUrl: 'templates/popups/install.html',
                title: '<span translate="spl_title">Inital configuration</span>',
                scope: $scope,
                buttons: [
                    {
                        text: '<b><span translate="spl_cont">Continue</span></b>',
                        type: 'button-dark',
                        onTap: function(e) {
                            if (!vm.pass) {
                                e.preventDefault();
                            } else {

                                $ionicLoading.show({
                                    'template': "<span translate='spl_{{splash.bar.code}}'>{{splash.bar.message}}</span>"
                                    + "<progress value='{{splash.bar.value}}' max='100'></progress>",
                                    scope: $scope
                                });

                                savePass();
                                getVerbs()
                                    .then(downloadPictos, errorCallback, onProgress)
                                    .then(unzipPictos, errorCallback, onProgress)
                                    .then(updateDB, errorCallback, onProgress)
                                    .then(hidePopup, errorCallback, onProgress);
                            }
                        }
                    }
                ]
            };
            $ionicPopup.show(initialPopup);
        }

        function createDB() {
            if (!araworddb.ready()) {
                araworddb.startService();
            }
            return araworddb.createDB();
        }

        function getVerbs() {
            updateBar(0,'Downloading verbs','dverbs');
            return pictUpdater.getVerbs(vm.verbsSelect.selected);
        }

        function downloadPictos() {
            updateBar(0,'Downloading pictographs','dpict');
            return pictUpdater.downloadPictos();
        }

        function unzipPictos() {
            updateBar(0,'Unzipping pictographs','unzip');
            return pictUpdater.unzip();
        }

        function updateDB() {
            updateBar(0,'Adding pictographs', 'addpict');
            return pictUpdater.updatePictos();
        }

        function hidePopup() {
            setLang(vm.langSelect.selected.name);
            $window.localStorage["installed"] = true;
            $ionicLoading.hide();
            $location.path('/text');
        }

        function errorCallback(error) {
            if (JSON.stringify(error) != 'CHAINED_ERROR') {
                if (initialPopup) initialPopup.close();
                $ionicLoading.hide();
                $window.localStorage.removeItem('mainPass');
                var promise = popupsService.installError.show();
                promise.then(function() {
                    ionic.Platform.exitApp();
                })
            }
            return $q.reject('CHAINED_ERROR');
        }

        function onProgress(progressEvent) {
            if (progressEvent) {
                if (progressEvent && progressEvent.lengthComputable) {
                    updateBar(window.Math.round(progressEvent.loaded*100 / progressEvent.total));
                } else {
                    vm.bar.value++;
                }
            }
        }

        function setLang(lang) {
            araworddb.setLang(lang);
            configService.docLang = lang;
        }

        /**
         * Saves the password in local storage
         */
        function savePass() {
            $window.localStorage['mainPass'] = vm.pass;
        }

        /**
         * @returns {boolean} {{ True if password exists, otherwise false}}
         */
        function firstTime() {
            return angular.isUndefined($window.localStorage.getItem('installed'));
        }

        /**
         * Downloads the available verbs langs form the server and populates the
         * select structure with them.
         */
        function getVerbsLangs() {
            var deferred = $q.defer();
            pictUpdater.getVerbsLangs()
            .then(function(succ) {
                succ.data.doc.forEach(function (lang, ind) {
                    vm.verbsSelect.langs.push({
                        id: ind,
                        name: lang.code
                    });
                    vm.verbsSelect.selected = vm.verbsSelect.langs;
                    deferred.resolve();
                })
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function getLangs() {
            var deferred = $q.defer();
            pictUpdater.getSupportedLangs()
                .then(function(succ) {
                    succ.data.doc.forEach(function (lang, ind) {
                        vm.langSelect.langs.push({
                            id: ind,
                            name: lang.code
                        });
                        vm.langSelect.selected = vm.langSelect.langs[0];
                        deferred.resolve();
                    });
                    configService.configuration.supportedLangs = vm.langSelect.langs;
                }, function(error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function updateBar(value, message, code) {
            if(angular.isDefined(value)) vm.bar.value = value;
            if(message) vm.bar.message = message;
            if(code) vm.bar.code = code;
        }

    }

})();
