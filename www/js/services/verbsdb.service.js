/**
 * Created by diego on 6/03/16.
 *
 * Manages the verbs database.
 */

(function() {
    'use strict';

    angular
        .module('AraWord')
        .factory('verbsdb',verbsdb);

    verbsdb.$inject = ['$q'];

    function verbsdb($q) {

        var db = undefined;
        var dbname = undefined;

        var service = {
            startService: startService,
            getInfinitive: getInfinitive,
            ready: ready,
            setLang: setLang
        };

        return service;

        //////////

        function setLang(lang) {
            close();
            dbname = lang+'_database.db';
            startService();
        }

        /**
         * Returns the infinitive of a given formed verb.
         * @param verb {{ Formed verb }}
         * @returns {[String]}
         */
        function getInfinitive(verb) {
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM verbs WHERE form=\'" + verb.toLowerCase() +"\'";
                var result = [];

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    db.executeSql(query, [], function(res) {
                        for(var i = 0; i < res.rows.length; i++) {
                            result.push(res.rows.item(i).verb);
                        }
                        if (result.length==0) {
                            reject('NO_VERB');
                        }
                        resolve(result);
                    }, function (err) {
                        reject(err);
                    });
                }

            });
        }

        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                if (!dbname) {
                    dbname = 'es_database.db';
                }
                db = window.sqlitePlugin.openDatabase( {
                    name: dbname, createFromLocation: 1,
                    location: 'default'
                }, function(tx) {}, function(err) {
                });
            }
        }

        function ready() {
            return !angular.isUndefined(db);
        }

        function close() {
            db.close();
        }
    }
})();
