/**
 * Created by Diego on 28/03/16.
 *
 * Manages the popovers shown when menu options are tapped.
 */
(function (){
    'use strict';

    angular
        .module('AraWord')
        .controller('navController', navController);

    navController.$inject = ['$ionicPopover','$scope','accessService',
        '$ionicPopup','$window','$cordovaImagePicker', 'araworddb',
        '$cordovaFile','textAnalyzer','$location'];

    function navController($ionicPopover, $scope, accessService, $ionicPopup,
                           $window, $cordovaImagePicker, araworddb, $cordovaFile,
                           textAnalyzer, $location) {

        var vm = this;
        vm.showMenu = showMenu;
        vm.showSubMenu = showSubMenu;
        vm.closeMenus = closeMenus;
        vm.login = login;
        vm.pickImage = pickImage;

        // Options popover [Configuration, Save, Load, Add picto, Info]
        $ionicPopover.fromTemplateUrl('templates/popovers/dropdown.html', {
            scope: $scope
        }).then(function(popover){
            $scope.menu = popover;
        });

        // Configuration sub-popover [Profile, Access control]
        $ionicPopover.fromTemplateUrl('templates/popovers/securityOptions.html', {
            scope: $scope
        }).then(function(popover){
            $scope.subMenu = popover;
        });

        vm.acc = accessService;
        vm.saveDoc = saveDocument;
        vm.loadDoc = loadDoc;

        // Required to add new picto
        vm.newPicto = newPicto; // function
        vm.newPict = {'type': 0}; // new picto info (model)
        vm.newPictWord = ''; // new picto word (model)

        ///////////////

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
                login(function() {
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
         * @param callback {{ function to be executed on successful login }}
         */
        function login(callback) {
            // Password written model
            vm.pass = '';

            var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="nav.pass">',
                title: 'Enter Password',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>Save</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!vm.pass) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                // We retrieve the pass from localStorage
                                var mainPass = $window.localStorage['mainPass'];
                                if (vm.pass === mainPass) {
                                    vm.acc.logged = true;
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        }
                    }
                ]
            });

            // When login success it shows an alert
            myPopup.then(function(res){
                if(res) {
                    $ionicPopup.alert({
                            title: 'WARNING!!',
                            template: 'Now you are in admin mode, rememeber to restart the app so as to come back user mode.'
                    });
                    callback();
                }
            });
        }


        /**
         * Shows a popup that allows user to add new pictograph.
         */
        function newPicto() {
            $ionicPopup.show({
                templateUrl: 'templates/popups/newPicto.html',
                title: 'Add new pictograph',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>Save</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!vm.newPictWord || !vm.newPict.picto || !vm.newPict.origPath || !vm.newPict.destPath) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                $cordovaFile.copyFile(vm.newPict.origPath,vm.newPict.picto,vm.newPict.destPath,vm.newPict.picto);
                                araworddb.newPicto(vm.newPictWord,{'picto':vm.newPict.picto,'type':vm.newPict.type});
                                $scope.menu.hide();
                            }
                        }
                    }
                ]
            });
        }

        /**
         * Allows user to pick an image from gallery and save it's info into newPict object.
         */
        function pickImage() {
            $cordovaImagePicker.getPictures({'maximumImagesCount': 1})
                .then(function(result){
                    var separator = result[0].lastIndexOf('/');
                    var path = result[0].substr(0,separator);
                    var file = result[0].substr(separator+1);
                    var dirUrl = cordova.file.dataDirectory;
                    var dirName = 'pictos/pictos_12';
                    vm.newPict.picto = file;
                    vm.newPict.destPath = dirUrl+dirName;
                    vm.newPict.origPath = path;
                });
        }

        /**
         * Shows a popup that allows user to save the current document.
         */
        function saveDocument() {
            $ionicPopup.show({
                template: '<input type="text" ng-model="nav.docName"/>',
                title: 'Set document name',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>Save</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!vm.docName) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                console.log(vm.docName);
                                $cordovaFile.writeFile(cordova.file.dataDirectory,vm.docName+'.araw',textAnalyzer.text,true)
                                    .then(function(res) {
                                        console.log(JSON.stringify(res));
                                        $scope.menu.hide();
                                    }, function(err) {
                                        console.log(JSON.stringify(err));
                                        $scope.menu.hide();
                                    })
                            }
                        }
                    }
                ]
            });
            vm.docName = '';
        }

        /**
         * Shows the list of available documents and allows user to retrieve one of them.
         */
        function loadDoc() {
            vm.listFiles = [];
            var entries = listDir(cordova.file.dataDirectory, callback);

            function callback(entries) {
                entries.forEach(function(entry) {
                    if (entry.isFile && entry.nativeURL.lastIndexOf('.araw')==(entry.nativeURL.length-5)){
                        var separator = entry.nativeURL.lastIndexOf('/');
                        vm.listFiles.push({'name': entry.nativeURL.substr(separator+1)});

                    }
                });

                vm.fileToOpen = vm.listFiles[0].name;
                $ionicPopup.show({
                    templateUrl: 'templates/popups/listFiles.html',
                    title: 'Select a file',
                    scope: $scope,
                    buttons: [
                        { text: 'Cancel' },
                        {
                            text: '<b>Open</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                                if(!vm.fileToOpen) {
                                    e.preventDefault();
                                } else {
                                    $cordovaFile.readAsText(cordova.file.dataDirectory,vm.fileToOpen)
                                        .then(function(succ) {
                                            var vec = JSON.parse(succ);
                                            for(var i=0; i<vec.length;i++) {
                                                if(i<textAnalyzer.text.length) {
                                                    textAnalyzer.text[i] = vec[i];
                                                } else {
                                                    textAnalyzer.text.push(vec[i]);
                                                }
                                            }
                                            $scope.menu.hide();
                                        }, function(err) {
                                            console.log(JSON.stringify(err));
                                        })
                                }
                            }
                        }
                    ]
                });

            }


        }

        /**
         * List all the files in a path and executes callback when finished.
         * @param path {{ directory }}
         * @param callback {{ function to be executed }}
         */
        function listDir(path, callback){
            window.resolveLocalFileSystemURL(path,
                function (fileSystem) {
                    var reader = fileSystem.createReader();
                    reader.readEntries(
                        function (entries) {
                            callback(entries);
                        },
                        function (err) {
                            console.log(err);
                        }
                    );
                }, function (err) {
                    console.log(err);
                }
            );
        }
    }

})();