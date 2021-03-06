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

    splashController.$inject = ['$ionicLoading', '$location', '$ionicPopup', '$window', '$scope', '$q',
        'araworddb', 'configService', 'popupsService', 'pictoService', '$filter'];

    /**
     * Controller
     * @param $ionicLoading - Required to show loading popup while downloading pictographs
     * @param $location - Required to be redirected
     * @param $ionicPopup - Required to show popups
     * @param $window - Required to access localStorage
     * @param $scope - Required to access to the controller from the popups
     * @param $q - Required to work with promises
     * @param araworddb - Required to create the DB
     * @param configService - Required to save language configuration
     * @param popupsService - Required to show popups
     * @param pictoService - Required to update pictographs
     * @param pictoService - Required to update pictographs
     * @param $filter - Required to translate popups titles
     */
    function splashController( $ionicLoading, $location, $ionicPopup, $window, $scope, $q, araworddb,
                              configService, popupsService, pictoService, $filter) {


        var vm = this;
        vm.placeholder = $filter('translate')('com_pass');
        vm.replaceholder = $filter('translate')('com_repass');
        vm.pass = null;
        vm.repass = null;

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
            getLangs()
                .then(createDB, errorCallback)
                .then(showPopup, errorCallback);

        } else {
            $location.path('/text');
        }

        /////////////////////////////

        /**
         * Shows the installation popup when the language and admin password
         * are selected.
         */
        function showPopup() {
            var initialTitle = $filter('translate')('spl_title');
            var cont = $filter('translate')('spl_cont');
            initialPopup = {
                templateUrl: 'templates/popups/install.html',
                title: '<span>'+initialTitle+'</span>',
                scope: $scope,
                buttons: [
                    {
                        text: '<b><span>'+cont+'</span></b>',
                        type: 'button-dark',
                        onTap: function(e) {
                            if (!vm.pass || !vm.repass || vm.pass!=vm.repass) {
                                if (vm.pass!=vm.repass) {
                                    vm.repass = ''; vm.pass='';
                                    vm.placeholder = $filter('translate')('com_paserr');
                                }
                                e.preventDefault();
                            } else {

                                $ionicLoading.show({
                                    'template': "<span translate='spl_{{splash.bar.code}}'>{{splash.bar.message}}</span>"
                                    + "<progress value='{{splash.bar.value}}' max='100'></progress>",
                                    scope: $scope
                                });

                                savePass();
                                downloadFormedVerbs()
                                    .then(downloadPictos, errorCallback)
                                    .then(hidePopup, errorCallback);
                            }
                        }
                    }
                ]
            };
            $ionicPopup.show(initialPopup);
        }

        /**
         * Downloads all the formed verbs databases specified in vm.verbsSelect.selectd
         * @returns {Promise}
         */
        function downloadFormedVerbs() {
            return pictoService.downloadVerbsDB(vm.verbsSelect.selected,vm.bar);
        }

        /**
         * Downloads all the pictographs required to use the app.
         * @returns {*|Promise}
         */
        function downloadPictos() {
            return pictoService.updatePictos(vm.bar,true);
        }

        /**
         * Creates the basic DB structure if it has not been created previously.
         * @returns {Promise} - Resolved if DB is ready, otherwise rejected
         */
        function createDB() {
            if (!araworddb.ready()) {
                araworddb.startService();
            }
            return araworddb.createDB();
        }

        /**
         * Last function into the chain, sets the app as installed and configures the
         * database language.
         */
        function hidePopup() {
            setLang(vm.langSelect.selected);
            configService.saveConfig();
            $window.localStorage["installed"] = true;
            $ionicLoading.hide();
            $location.path('/text');
        }

        /**
         * Propagates the error through the chain but only exectued once.
         * @param {Object} error - The error which has triggered this callback
         * @returns {Promise.reject}
         */
        function errorCallback(error) {
            if (JSON.stringify(error) != 'CHAINED_ERROR') {
                if (initialPopup && initialPopup.close) initialPopup.close();
                $ionicLoading.hide();
                $window.localStorage.removeItem('mainPass');
                var promise = popupsService.installError.show();
                promise.then(function() {
                    ionic.Platform.exitApp();
                })
            }
            return $q.reject('CHAINED_ERROR');
        }

        /**
         * Sets the application language to the user selected one
         * @param {String} lang - Selected language.
         */
        function setLang(lang) {
            araworddb.setLang(lang.code);
            configService.docLang = configService.configuration.supportedLangs[lang.id];
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
            var value = $window.localStorage.getItem('installed');
            return angular.isUndefined(value) || value!="true";
        }


        /**
         * Downloads the list of supported langs and fills the installation
         * popup selects with them.
         * @returns {Promise} - Resolved if download goes well, otherwise rejected
         */
        function getLangs() {
            var deferred = $q.defer();
            pictoService.getSupportedLangs()
                .then(function(data) {
                    data['mainLangs'].forEach(function(lang) {
                        araworddb.addLanguagesBulk([lang.long]);
                        configService.configuration.supportedLangs.push(lang);
                        vm.langSelect.langs.push({
                            'id': lang.id,
                            'name': lang.code,
                            'code': lang.code
                        })
                    });
                    vm.langSelect.selected = vm.langSelect.langs[0];
                    data['verbLangs'].forEach(function(lang) {
                        vm.verbsSelect.langs.push({
                            'id': lang.id,
                            'name': lang.code,
                            'code': lang.code
                        })
                    });
                    vm.verbsSelect.selected = vm.verbsSelect.langs;
                    deferred.resolve();
                }, deferred.reject);
            return deferred.promise;
        }

    }

})();
