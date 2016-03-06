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
            getCompoundsStartingWith: getCompoundsStartingWith,
            ready: ready
        };

        return service;

        ///////////////////////////////////////////////////////////////////

        function getPictographs(word) {
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word=\'" + word.toLowerCase() +"\'";
                var result = [];

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    $cordovaSQLite.execute(db, query).then(function(res) {
                        for(var i = 0; i < res.rows.length; i++) {

                            var type = null;
                            if (res.rows.item(i).type=="nombreComun") type = 0;
                            else if (res.rows.item(i).type=="descriptivo") type = 1;
                            else if (res.rows.item(i).type=="verbo") type = 2;
                            else if (res.rows.item(i).type=="miscelanea") type = 3;
                            else if (res.rows.item(i).type=="nombrePropio") type = 4;
                            else { type = 5; }

                            result.push({
                                'picto': res.rows.item(i).name,
                                'type': type
                            });
                        }
                        if (result.length==0) {
                            reject('NO_PICT');
                        }
                        resolve(result);
                    }, function (err) {
                        reject(err);
                    });
                }

            });
        };

        function getCompoundsStartingWith(word) {
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + word.toLowerCase() +" \%\'";
                var compounds = [];

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    $cordovaSQLite.execute(db, query).then(function(res) {
                        for(var i = 0; i < res.rows.length; i++) {
                            compounds.push(res.rows.item(i).word);
                        }
                        if (compounds.length==0) {
                            reject('NO_COMPOUNDS');
                        }
                        resolve(compounds);
                    }, function (err) {
                        reject(err);
                    });
                }

            });
        }

        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, createFromLocation: 1} );
            }
        }

        function ready() {
            return !angular.isUndefined(db);
        }
    };

})();

