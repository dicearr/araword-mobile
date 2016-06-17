/**
 * Created by Diego on 28/03/16.
 *
 * Manages the popovers shown when menu options are tapped.
 */
(function () {
    'use strict';

    angular
        .module('AraWord')
        .controller('navController', navController);

    navController.$inject = ['$ionicPopover', '$scope', 'accessService',
        '$ionicPopup', '$window', '$cordovaImagePicker', 'araworddb',
        '$cordovaFile', 'textAnalyzer', '$location', 'docsService', '$q',
        'popupsService', 'configService', 'pictoService','$ionicLoading'];

    function navController($ionicPopover, $scope, accessService, $ionicPopup,
                           $window, $cordovaImagePicker, araworddb, $cordovaFile,
                           textAnalyzer, $location, docsService, $q, popupsService,
                           configService, pictoService, $ionicLoading) {

        var vm = this;
        vm.showMenu = showMenu;
        vm.showSubMenu = showSubMenu;
        vm.closeMenus = closeMenus;
        vm.login = login;
        vm.pickImage = pickImage;
        vm.otherFile = null;

        // Options popover [Configuration, Save, Load, Add picto, Info]
        $ionicPopover.fromTemplateUrl('templates/popovers/dropdown.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.menu = popover;
        });

        // Configuration sub-popover [Profile, Access control]
        $ionicPopover.fromTemplateUrl('templates/popovers/securityOptions.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.subMenu = popover;
        });

        vm.acc = accessService;
        vm.saveDoc = saveDocument;
        vm.loadDoc = loadDoc;

        // Required to add new picto
        vm.newPicto = newPicto; // function
        vm.newPict = {'type': 0}; // new picto info (model)
        vm.newPictWord = ''; // new picto word (model)

        vm.help = help;
        vm.searchUpdates = searchUpdates;
        vm.bar = {
            'code': '',
            'value': 0,
            'message': ''
        };

        ///////////////

        function searchUpdates() {
            $ionicLoading.show({
                'template': "<span translate='spl_{{nav.bar.code}}'>{{nav.bar.message}}</span>"
                + "<progress value='{{nav.bar.value}}' max='100'></progress>",
                scope: $scope
            });
            pictoService.updatePictos(vm.bar);
        }

        function help() {
            $ionicPopup.alert({
                title: 'Acerca de Araword',
                template: '<p style="text-align: center">**Desarrollador**<br>Diego Ceresuela Arrazola (EINA)<br>' +
                '**Director**<br>Dr. Joaquín Ezpeleta (EINA)<br>' +
                '**Colaborador**<br>José Manuel Marcos (CPEE Alborada)<br>' +
                '**Entidades**<br>Universidad de Zaragoza (UZ)<br>' +
                'Colegio público de educación especial Alborada (CPEE Alborada)<br>' +
                '** Pictogramas ARASAAC http://arasaac.org **</p>'
            });
        }

        /**
         * Displays the options popover.
         * @param event {{ Object that determines the popover position }}
         */
        function showMenu(event) {
            $scope.menu.show(event);
        }

        /**
         * If the privileged user is logged displays the configuration sub-popover
         */
        function showSubMenu() {
            if (!vm.acc.logged) {
                login(function () {
                    // We use a class (posit) to show the popover next to the options popover instead of under.
                    $scope.subMenu.show(angular.element(document.querySelector('.posit')));
                });
            } else {
                $scope.subMenu.show(angular.element(document.querySelector('.posit')));
            }
        }

        /**
         * Closes all the popovers.
         */
        function closeMenus() {
            $scope.subMenu.hide();
            $scope.menu.hide();
        }

        /**
         * Shows the login popup and executes callback if login is correct.
         * @param {function} callback Function to be executed on successful login
         */
        function login(callback) {
            // Password written model
            $scope.data = {
                pass: ''
            };
            var myPopup = popupsService.login;
            myPopup.onContinue = function (e) {
                if (!$scope.data.pass) {
                    //don't allow the user to close unless he enters wifi password
                    e.preventDefault();
                } else {
                    // We retrieve the pass from localStorage
                    var mainPass = $window.localStorage['mainPass'];
                    if ($scope.data.pass === mainPass) {
                        vm.acc.logged = true;
                        return true;
                    } else {
                        return false;
                    }
                }
            };
            var promise = myPopup.show($scope);
            // When login success it shows an alert
            promise.then(function (res) {
                if (res) {
                    $ionicPopup.alert({
                        title: '<span translate="adm_title">WARNING!!</span>',
                        template: '<p translate="adm_message">Now you are in admin mode, rememeber to restart the app so as to come back user mode.</p>'
                    });
                    callback();
                }
            });
        }


        /**
         * Shows a popup that allows user to add new pictograph.
         */
        function newPicto() {
            var newPicto = popupsService.newPicto;
            newPicto.onSave = function (e) {
                if (!vm.newPict.word || !vm.newPict.fileName || !vm.newPict.oldPath ) {
                    e.preventDefault();
                } else {
                    pictoService.addPicto(vm.newPict);
                    $scope.menu.hide();
                }
            };
            newPicto.show($scope);
        }

        /**
         * Allows user to pick an image from gallery and save it's info into newPict object.
         */
        function pickImage() {
            $cordovaImagePicker.getPictures({'maximumImagesCount': 1})
                .then(function (result) {
                    if (result[0]) {
                        var separator = result[0].lastIndexOf('/');
                        vm.newPict.fileName = result[0].substr(separator + 1);
                        vm.newPict.oldPath = result[0].substr(0, separator);
                    }
                });
        }

        /**
         * Shows a popup that allows user to save the current document.
         */
        function saveDocument() {
            $scope.data = {
                'docName': textAnalyzer.docName
            };
            var saveDocument = popupsService.saveDocument;
            saveDocument.onSave = function (e) {
                if (!$scope.data.docName) {
                    e.preventDefault();
                } else {
                    docsService.saveDoc(textAnalyzer.text, null, $scope.data.docName);
                    closeMenus();
                    textAnalyzer.docName = $scope.data.docName;
                }
            };
            saveDocument.show($scope, false);
        }

        /**
         * Shows the list of available documents and allows user to retrieve one of them.
         */
        function loadDoc() {

            vm.listFiles = [];
            docsService.getDocsList(null)
                .then(function (files) {

                    vm.listFiles = files;
                    if (vm.listFiles[0]) {
                        vm.fileToOpen = vm.listFiles[0].name;
                    }

                    $scope.data = {
                        'listFiles': vm.listFiles,
                        'fileToOpen': vm.fileToOpen
                    };

                    var listFiles = popupsService.listFiles;
                    listFiles.onOpen = function (e) {
                        if (!$scope.data.fileToOpen) {
                            e.preventDefault();
                        } else {
                            docsService.openDoc(null, $scope.data.fileToOpen);
                            closeMenus();
                        }
                    };
                    listFiles.show($scope);
                });
        }
    }

})();