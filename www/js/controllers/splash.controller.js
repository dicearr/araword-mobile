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

    splashController.$inject = ['pictUpdater','$timeout','$ionicLoading', '$location', '$ionicPopup', '$window', '$scope'];

    function splashController(pictUpdater, $timeout, $ionicLoading, $location, $ionicPopup, $window, $scope) {

        var loadingBarValue = 0;
        var loadingBarMessage = 'Downloading pictographs';
        var loadingBarCode = 'download';

        var vm = this;
        vm.pass = '';

        if (!havePass()) {
            $ionicPopup.show({
                template: '<div class="list">' +
                ' <label class="item item-input item-select">' +
                ' <span class="input-label" translate="spl_lang"> Language </span>' +
                ' <select>' +
                ' <option>ES</option>' +
                ' <option selected>EN</option>' +
                ' <option>CAT</option>' +
                ' </select>'+
                ' </label>' +
                ' <input class="item item-input" style="margin-top: 4px" placeholder="Password" type="password" ng-model="splash.pass"/>'+
                '</div>',
                title: '<span translate="spl_title">Language configuration</span>',
                scope: $scope,
                buttons: [
                    {
                        text: '<b><span translate="spl_cont">Continue</span></b>',
                        type: 'button-dark',
                        onTap: function(e) {
                            if (!vm.pass) {
                                console.log('EmptyPass!')
                                e.preventDefault();
                            } else {
                                savePass();
                                updateBar();
                                $timeout(function() {
                                    loadingBarMessage = 'Unzipping pictographs';
                                    loadingBarCode = 'unzip';
                                    pictUpdater.unzip(onProgress).then(function() {
                                        loadingBarValue = 100;
                                        loadingBarMessage = 'Complete';
                                        loadingBarCode = 'end';
                                        updateBar();
                                        $timeout(function() {
                                            $ionicLoading.hide();
                                            $location.path('/text');
                                        },1000);
                                    });
                                }, 10000);
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
            loadingBarValue = Math.round((progress.loaded / progress.total) * 100);
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
