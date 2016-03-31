/**
 * Created by diego on 11/03/16.
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

        pictUpdater.unzip().then(function() {
            console.log('GO');
        });

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
                                    loadingBarValue = 50;
                                    updateBar();
                                    $timeout(function() {
                                        loadingBarValue = 100;
                                        loadingBarMessage = 'Complete';
                                        loadingBarCode = 'end';
                                        updateBar();
                                        $timeout(function() {
                                            $ionicLoading.hide();
                                            $location.path('/text');
                                        },1000);
                                    }, 10000)
                                }, 10000);
                            }
                        }

                    }
                ]
            });
        } else {
            $location.path('/text');
        }




        function updateBar() {
            $ionicLoading.show({
                'template': "<span translate='spl_"+loadingBarCode+"'>" + loadingBarMessage + "</span>"
                + "<progress value=\"" + loadingBarValue + "\" max=\"100\"></progress>"
            });
        }

        function savePass() {
            $window.localStorage['mainPass'] = vm.pass;
        }

        function havePass() {
            return !angular.isUndefined($window.localStorage['mainPass']);
        }
    }

})();
