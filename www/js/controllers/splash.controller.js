/**
 * Created by diego on 11/03/16.
 */

(function() {
    'use strict';

    angular
        .module('AraWord')
        .controller('splashController',splashController);

    splashController.$inject = ['pictUpdater','$timeout','$ionicLoading', '$location', '$ionicPopup'];

    function splashController(pictUpdater, $timeout, $ionicLoading, $location, $ionicPopup) {

        var loadingBarValue = 0;
        var loadingBarMessage = 'Downloading pictographs';
        var loadingBarCode = 'download';

        pictUpdater.unzip().then(function() {
            console.log('GO');
        });

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
                      '</div>',
            title: '<span translate="spl_title">Language configuration</span>',
            buttons: [
                {
                    text: '<b><span translate="spl_cont">Continue</span></b>',
                    type: 'button-dark',
                    onTap: function() {
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
            ]
        });


        function updateBar() {
            $ionicLoading.show({
                'template': "<span translate='spl_"+loadingBarCode+"'>" + loadingBarMessage + "</span>"
                + "<progress value=\"" + loadingBarValue + "\" max=\"100\"></progress>"
            });
        }
    }

})();
