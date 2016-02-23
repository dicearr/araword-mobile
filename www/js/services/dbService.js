/**
 * Created by Diego Ceresuela on 17/02/16.
 */
(function () {
    'use strict';

    angular
        .module('app')
        .factory('dbService', dbService);

    dbService.$inject = ['$cordovaSQLite','$q'];

    function dbService($cordovaSQLite, $q) {

        var db = undefined;
        var dbname = 'AraSuite.db';

        var service = {
            startService: startService,
            getPictographs: getPictographs,
            ready: ready
        };

        return service;

        ///////////////////////////////////////////////////////////////////

        function getPictographs(word) {
            return $q(function(resolve,reject){
                var query = "SELECT * FROM ArawordView WHERE word=\'" + word.toLowerCase() +"\'";
                var pictos = [];

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    $cordovaSQLite.execute(db, query).then(function(res) {
                        for(var i = 0; i < res.rows.length; i++) {
                            pictos.push(res.rows.item(i).name);
                        }
                        resolve(pictos);
                    }, function (err) {
                        reject(err);
                    });
                }

            });
        };

        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, createFromLocation: 1} );
            }
        };

        function ready() {
            return !angular.isUndefined(db);
        };
    };

})();

