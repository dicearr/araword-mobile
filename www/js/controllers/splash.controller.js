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

    splashController.$inject = ['pictUpdater','$timeout','$ionicLoading', '$location',
            '$ionicPopup', '$window', '$scope', '$translate', 'configService','$http'];

    function splashController(pictUpdater, $timeout, $ionicLoading, $location,
                              $ionicPopup, $window, $scope, $translate, configService,$http) {

        var loadingBarValue = 0;
        var loadingBarMessage = 'Downloading pictographs';
        var loadingBarCode = 'download';

        var vm = this;
        vm.pass = '';
        vm.langs = [];
        vm.models = [];
        vm.change = function() {
            console.log(JSON.stringify(vm.models));
        };

        console.log(JSON.stringify(JSZip.support));

        // TODO server IP
        $http({
            'method': 'get',
            'url': 'http://192.168.1.103:3000/verbs/list'
            })
            .then(function(succ) {
                succ.data.doc.forEach(function (lang, ind) {
                    vm.langs.push({
                        id: ind,
                        name: lang.code
                    })
                })
            }, function(err) {
                // Installation error
            });

        if (!havePass()) {
            $ionicPopup.show({
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
                                savePass();
                                var nLangs = vm.langs.length;
                                loadingBarValue = 0;
                                loadingBarMessage = 'Downloading verbs';
                                loadingBarCode = 'dverbs';
                                updateBar();
                                pictUpdater.getVerbs(vm.models)
                                    .then(function() {
                                        loadingBarMessage = 'Downloading pictographs';
                                        loadingBarCode = 'dpict';
                                        updateBar();
                                        pictUpdater.downloadPictos(onProgress)
                                            .then(function() {
                                                loadingBarMessage = 'Unzipping pictographs';
                                                loadingBarCode = 'unzip';
                                                updateBar();
                                                pictUpdater.unzip(onProgress).then(function() {
                                                    loadingBarValue = 0;
                                                    loadingBarMessage = 'Adding pictographs';
                                                    loadingBarCode = 'addpict';
                                                    pictUpdater.updatePictos().then(function() {
                                                        $ionicLoading.hide();
                                                        $location.path('/text');
                                                    }, function() {}, function(sum) {
                                                        loadingBarValue+=sum;
                                                        updateBar();
                                                    })
                                                });
                                            }, function (err) {
                                                console.log(JSON.stringify(err));
                                            });

                                    }, function(error) {
                                        console.log('Download error');
                                        // Instalation error
                                    }, function() {
                                        loadingBarValue += 100/nLangs;
                                        updateBar();
                                    });
                            }
                        }

                    }
                ]
            });
        } else {
            $location.path('/text');
        }

        /////////////////////////////

        /**
         * Executed when unzip process advances
         * @param progress {{ new progress }}
         */
        function onProgress(progress) {
            if (progress.lenghtComputable) {
                loadingBarValue = Math.round((progress.loaded / progress.total) * 100);
            } else {
                loadingBarValue += 1;
            }
            updateBar();
        }

        /**
         * Changes the view template with new progress values
         */
        function updateBar() {
            $ionicLoading.show({
                'template': "<span translate='spl_"+loadingBarCode+"'>" + loadingBarMessage + "</span>"
                + "<progress value=\"" + loadingBarValue + "\" max=\"100\"></progress>"
            });
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
        function havePass() {
            return !angular.isUndefined($window.localStorage['mainPass']);
        }
    }

})();
