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

        pictUpdater.unzip().then(function() {
            console.log('GO');
        });

        $ionicPopup.show({
            template: '<div class="list">' +
                        ' <label class="item item-input item-select">' +
                        ' <div class="input-label"> Language </div>' +
                            ' <select>' +
                            ' <option>ES</option>' +
                            ' <option selected>EN</option>' +
                            ' <option>CAT</option>' +
                            ' </select>'+
                        ' </label>' +
                      '</div>',
            title: 'Language configuration',
            buttons: [
                {
                    text: '<b>Continue</b>',
                    type: 'button-dark',
                    onTap: function() {
                        updateBar();
                        $timeout(function() {
                            loadingBarMessage = 'Unzipping pictographs';
                            loadingBarValue = 50;
                            updateBar();
                            $timeout(function() {
                                loadingBarValue = 100;
                                loadingBarMessage = 'Complete';
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
                'template': "<span>" + loadingBarMessage + "</span>"
                + "<progress value=\"" + loadingBarValue + "\" max=\"100\"></progress>"
            });
        }
    }

})();
