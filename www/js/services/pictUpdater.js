/**
 * Created by diego on 17/02/16.
 */

(function() {
    'use strict';

    angular
        .module('app')
        .factory('pictUpdater',  pictUpdater);

    pictUpdater.$inject = ['$cordovaFile','$q'];

    function pictUpdater($cordovaFile, $q) {

        var fileName = 'pictos.zip';
        var dirName = 'pictos';

        var service = {
            update: update,
            unzip: unzip
        };

        return service;

        /////////////////////////////////

        function update() {

        };

        function unzip() {

            return $q(function(resolve,reject){

                document.addEventListener('deviceready', unzipHandler, false);

                function unzipHandler() {

                    var dirUrl = cordova.file.dataDirectory;
                    var origDirZip = cordova.file.applicationDirectory + 'www';
                    var destDirZip = cordova.file.dataDirectory;

                    $cordovaFile.checkDir(dirUrl,dirName)
                        .then(function(success){
                            resolve('PIC_ALREADY_UNZIPPED');
                        }, function() {
                            $cordovaFile.copyFile(origDirZip, fileName, destDirZip, fileName)
                                .then(function (success) {
                                    $cordovaFile.createDir(dirUrl,dirName,false)
                                        .then(function(success) {
                                            zip.unzip(destDirZip+fileName, dirUrl+dirName,
                                                function (result) {
                                                    resolve(result);
                                                });
                                        }, function (error) {
                                            reject(error);
                                        });
                                }, function (error) {
                                    reject(error);
                                });
                        });
                };
            });
        };
    };
})();

/* DESCARGA pictogramas
 document.addEventListener('deviceready', function() {

 $cordovaFile.getFreeDiskSpace()
 .then(function(success) {
 console.log('ORIGINALSIZE: '+ success);
 });

 var url = 'https://arasaac.os-eu-mad-1.instantservers.telefonica.com/zonadescargas/pictos.zip?Signature=PD%2BtKmdn%2Bg7zOjrPiOMNBjp6Qrw%3D&Expires=11423062190&AWSAccessKeyId=cs20642893';
 var targetPath = cordova.file.dataDirectory + "pictos.zip";

 $cordovaFileTransfer.download(url, targetPath, {encodeURI: false}, true)
 .then(function(result) {
 $cordovaFile.getFreeDiskSpace()
 .then(function(success) {
 console.log('NEWSIZE: '+ success);
 });
 }, function(error) {
 console.log('ERROR: '+ JSON.stringify(error));
 }, function(progress) {
 $timeout(function() {
 console.log('Downloading: '+(progress.loaded/progress.total).toFixed()+'%');
 });
 });
 }, false);*/


/* COMPROBAR version de los pictogramas
 document.addEventListener('deviceready', function() {
 $http({
 method: 'get',
 url: 'http://arasaac.org/zona_descargas/arasuite/pictos_data',
 transformResponse: undefined,
 transformRequest: undefined
 }).then(
 function (data) {
 console.log('SUCCESS', JSON.stringify(data));
 },
 function (error) {
 console.log('ERROR', JSON.stringify(error));
 }
 )}, false);*/