/**
 * Created by diego on 17/06/16.
 *
 * Manages all the interaction with the pictographs server. It also
 * provides all the information about the server.
 */
(function() {

    'use strict';

    angular
        .module('AraWord')
        .factory('serverService', serverService);

    serverService.$inject = ['$q','$http'];

    function serverService($q, $http) {

        var HOST = '192.168.0.129', PORT = 3000;

        var service = {
            'server': {
                'HOST': HOST,
                'PORT': PORT,
                'HTTP': 'http://'+HOST+':'+PORT
            },
            'download': download,
            'query': query
        };

        return service;

        //////////////////////////////////

        /**
         * Downloads the resource available in the given URI
         * @param {String} uri - Resource unique identifier
         * @param {String} dest - Complete path when the file will be downloaded (incluiding file name)
         * @param {Function} successCallback - Function to be executed on success
         */
        function download(uri, dest, successCallback, onProgress) {
            var deferred = $q.defer();
            var uri = encodeURI(service.server.HTTP + uri);
            var fileTransfer = new FileTransfer();
            fileTransfer.onprogress = onProgress?onProgress:deferred.notify;
            fileTransfer.download(
                uri,
                dest,
                function () {
                    if (successCallback) successCallback();
                    deferred.resolve();
                },
                function (error) {
                    deferred.reject({
                        'code': 'DOWNLOAD_ERROR',
                        'error': error
                    });
                },
                true
            );
            return deferred.promise;
        }

        /**
         * GETs the server in the given URI
         * @param {String} uri - Unique resource identifier
         * @returns {Promise} - Resolved if server responses well, otherwise reject.
         */
        function query(uri) {
            var deferred = $q.defer();
            $http.get(service.server.HTTP + uri)
                .then(function(succ) {
                    deferred.resolve(succ.data.doc);
                },function(err) {
                    deferred.reject({
                        'code': 'CANNOT_FETCH_LANGS',
                        'error': err
                    })
                });
            return deferred.promise;
        }
    }
})();