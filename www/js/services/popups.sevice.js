/**
 * Created by diego on 14/06/16.
 */
(function() {
    'use strict';

    angular
        .module('AraWord')
        .factory('popupsService', popupsService);

    popupsService.$injec = ['$ionicPopup','$filter'];


    function popupsService($ionicPopup, $filter) {

        var popupCount = 0;

        // translate directive doesn't work in buttons/titles
        var translate = {
            'com_cancel': $filter('translate')('com_cancel'),
            'com_save': $filter('translate')('com_save'),
            'pu_addpict': $filter('translate')('pu_addpict'),
            'pu_openDocTitle': $filter('translate')('pu_openDocTitle'),
            'com_open': $filter('translate')('com_open'),
            'pu_saveDocTitle': $filter('translate')('pu_saveDocTitle'),
            'spl_cont': $filter('translate')('spl_cont'),
            'pu_pass': $filter('translate')('pu_pass'),
            'pu_saveDocQuest': $filter('translate')('pu_saveDocQuest'),
            'com_discard': $filter('translate')('com_discard'),
            'pu_insError': $filter('translate')('pu_insError')
        };

        var newPicto = {
            templateUrl: 'templates/popups/newPicto.html',
            title: '<span>'+ translate['pu_addpict']+'</span>',
            scope: undefined,
            buttons: [
                { text: '<span>'+translate['com_cancel']+'</span>' },
                {
                    text: '<b>'+translate['com_save']+'</b>',
                    type: 'button-positive'
                }
            ]
        };

        var listFiles = {
            templateUrl: 'templates/popups/listFiles.html',
            title: '<span>'+translate['pu_openDocTitle']+'</span>',
            scope: undefined,
            buttons: [
                { text: '<span>'+translate['com_cancel']+'</span>' },
                {
                    text: '<b>'+translate['com_open']+'</b>',
                    type: 'button-positive'
                }
            ]
        };

        var saveDocument = {
            template: '<input type="text" ng-model="data.docName"/>',
            title: '<span>'+translate['pu_saveDocTitle']+'</span>',
            scope: undefined,
            buttons: [
                { text: '<span>'+translate['com_cancel']+'</span>' },
                {
                    text: '<b>'+translate['com_save']+'</b>',
                    type: 'button-positive'
                }
            ]
        };

        var login = {
            template: '<input type="password" ng-model="data.pass">',
            title: '<span>'+translate['pu_pass']+'</span>',
            scope: undefined,
            buttons: [
                { text: '<span>'+translate['com_cancel']+'</span>' },
                {
                    text: '<b>'+translate['spl_cont']+'</b>',
                    type: 'button-positive'
                }
            ]
        };

        var installError = {
            title: '<b>'+translate['pu_insError']+'</b>',
            templateUrl: 'templates/popups/error.html'
        };

        var vm = this;
        var service = {
            "listFiles": {
                "show": showListFiles,
                "onOpen": undefined
            },
            "saveDocument": {
                "show": showSaveDocument,
                "onSave": undefined
            },
            "newPicto": {
                "show": showNewPicto,
                "onSave": undefined
            },
            "login": {
                "show": showLogin,
                "onContinue": undefined
            },
            "installError": {
                "show": showInstallError
            }
        };
        vm.service = service;
        return service;

        function showInstallError() {
            return $ionicPopup.alert(installError);
        }

        function showListFiles(scope) {
            listFiles.scope = scope;
            listFiles.buttons[1].onTap = service.listFiles.onOpen;
            return $ionicPopup.show(listFiles);
        }

        function showSaveDocument(scope, exists) {
            saveDocument.buttons[1].onTap = service.saveDocument.onSave;
            saveDocument.scope = scope;
            if (exists) {
                saveDocument.title = '<span>'+translate['pu_saveDocQuest']+'</span>';
                saveDocument.buttons[0].text = '<b>'+translate['com_discard']+'</b>'
            } else {
                saveDocument.title = '<span>'+translate['pu_saveDocTitle']+'</span>';
                saveDocument.buttons[0].text = '<span>'+translate['com_cancel']+'</span>';
            }
            return $ionicPopup.show(saveDocument);
        }

        function showNewPicto(scope) {
            newPicto.buttons[1].onTap = service.newPicto.onSave;
            newPicto.scope = scope;
            return $ionicPopup.show(newPicto);
        }

        function showLogin(scope) {
            login.buttons[1].onTap = service.login.onContinue;
            login.scope = scope;
            return $ionicPopup.show(login);
        }


    }

})();