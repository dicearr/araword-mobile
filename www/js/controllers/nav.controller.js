/**
 * Created by Diego on 28/03/16.
 *
 * Manages all the operations required by popups/popover's buttons.
 * Ops; login, pickImage, newPicto, searchUpdates
 */
(function () {
    'use strict';

    angular
        .module('AraWord')
        .controller('navController', navController);

    navController.$inject = ['$ionicPopover', '$scope', 'accessService', '$ionicPopup', '$window', '$cordovaImagePicker',
        'textAnalyzer', 'docsService', 'popupsService', 'pictoService','$ionicLoading', 'configService','$filter'];

    /**
     * Controller
     * @param $ionicPopover - Required to show the popovers
     * @param $scope - Required to access to the controller from the popovers/popups
     * @param accessService - Required to know which functionalities are available
     * @param $ionicPopup - Required to show the popups TODO: pictoService
     * @param $window - Required to access localStorage
     * @param $cordovaImagePicker - Required to select images (to add pictos)
     * @param textAnalyzer - Required to access the current text
     * @param docsService - Required to save/load documents
     * @param popupsService - Required to show the popups
     * @param pictoService - Required to upload pictographs
     * @param $ionicLoading - Required to show loading popup
     * @param configService - Required to know if new verbs db is available when updating
     * @param $filter
     * @param araworddb
     */
    function navController($ionicPopover, $scope, accessService, $ionicPopup, $window, $cordovaImagePicker,
                           textAnalyzer, docsService,  popupsService, pictoService, $ionicLoading, configService, $filter, araworddb) {

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

        // Configuration sub-popover [Profile, Access control, Update]
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
        vm.newPict = {'type': 3}; // new picto info (model)
        vm.newPictWord = ''; // new picto word (model)

        vm.help = help;
        vm.searchUpdates = searchUpdates;
        vm.bar = {
            'code': '',
            'value': 0,
            'message': ''
        };
        vm.verbsSelect = {
            'selected':[],
            'langs': []
        };

        ///////////////

        /**
         * Searches for updates and download new pictographs if available
         */
        function searchUpdates() {
            pictoService.getSupportedLangs()
                .then(function(data) {
                    var currentLangs = configService.configuration.supportedLangs;
                    data['mainLangs'].forEach(function(lang,ind) {
                        araworddb.addLanguagesBulk(lang.long);
                        if (lang.haveVerbs && !currentLangs[ind].haveVerbs) {
                            vm.verbsSelect.langs.push({
                                'id': lang.id,
                                'name': lang.code,
                                'code': lang.code
                            });
                        }
                        vm.verbsSelect.selected = vm.verbsSelect.langs;
                    });
                    configService.configuration.supportedLangs = data['mainLangs'];
                    var langPopup = {
                        templateUrl: 'templates/popups/update.html',
                        title: '<span translate="upd_title">Update langs</span>',
                        scope: $scope,
                        buttons: [
                            {
                                text: '<b><span translate="spl_cont">Continue</span></b>',
                                type: 'button-dark',
                                onTap: function(e) {

                                    $ionicLoading.show({
                                        'template': "<span translate='spl_{{nav.bar.code}}'>{{nav.bar.message}}</span>"
                                        + "<progress value='{{nav.bar.value}}' max='100'></progress>",
                                        scope: $scope
                                    });

                                        pictoService.downloadVerbsDB(vm.verbsSelect.selected,vm.bar)
                                            .then(function() {
                                                vm.verbsSelect.langs = [];
                                                configService.saveConfig();
                                                return pictoService.updatePictos(vm.bar);
                                            })
                                            .then(function() {
                                                $ionicLoading.hide();
                                            })
                                }
                            }
                        ]
                    };
                    if (vm.verbsSelect.langs.length>0) {
                        console.log('NEW LANGS', JSON.stringify(vm.verbsSelect));
                        $ionicPopup.show(langPopup);
                    } else {
                        $ionicLoading.show({
                            'template': "<span translate='spl_{{nav.bar.code}}'>{{nav.bar.message}}</span>"
                            + "<progress value='{{nav.bar.value}}' max='100'></progress>",
                            scope: $scope
                        });
                        pictoService.updatePictos(vm.bar)
                            .then(function() {
                                $ionicLoading.hide();
                                closeMenus();
                             })
                    }
                }, function(err) {

                });
        }

        /**
         * Shows an information popup
         */
        function help() {
            $ionicPopup.alert({
                title: 'Acerca de Araword',
                template: '<p style="text-align: center">**Desarrollador**<br>Diego Ceresuela Arrazola (UZ)<br>' +
                '**Director**<br>Dr. Joaquín Ezpeleta (UZ)<br>' +
                '**Colaboradores**<br>José Manuel Marcos (CPEE Alborada)<br>' +
                'David Romero (ARASAAC)<br>' +
                '**Entidades**<br>Universidad de Zaragoza (UZ)<br>' +
                'Colegio público de educación especial Alborada (CPEE Alborada)<br>' +
                '** Pictogramas ARASAAC http://arasaac.org **<br>' +
                'Propiedad del Gobierno de Aragón</p>'
            });
        }

        /**
         * Displays the options popover.
         * @param event - Object that determines the popover position
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
         * @param {function} callback - Function to be executed on successful login
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
            vm.placeholder = $filter('translate')('com_word');
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
                'docName': textAnalyzer.docName.substr(0,textAnalyzer.docName.lastIndexOf('.'))
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