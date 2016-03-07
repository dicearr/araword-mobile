/**
 * Created by Diego Ceresuela on 17/02/16.
 *
 * Manages AraWord data base queries.
 */
(function () {
    'use strict';

    angular
        .module('AraWord')
        .factory('araworddb', araworddb);

    dbService.$inject = ['$cordovaSQLite','$q'];

    function araworddb($cordovaSQLite, $q) {

        var db = undefined;
        var dbname = 'AraSuite.db'; // Pre filled db


        var service = {
            startService: startService,
            getWordsStartingWith: getWordsStartingWith,
            ready: ready
        };

        return service;

        ///////////////////////////////////////////////////////////////////

        /**
         * Searches all the words that starts with the given word.
         * @param word = The word to search.
         * @returns {*} Promise
         */
        function getWordsStartingWith(word) {

            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + word.toLowerCase() +" \%\'" +
                    "UNION SELECT * FROM ArawordView WHERE word=\'" + word.toLowerCase() +"\'";
                var compounds = [];
                var words = [];

                document.addEventListener('deviceready', executeQuery, false);

                function executeQuery() {
                    $cordovaSQLite.execute(db, query).then(function(res) {
                        for(var i = 0; i < res.rows.length; i++) {

                            var word = res.rows.item(i).word;
                            var pictoName = res.rows.item(i).name;
                            var pictoType = parseType(res.rows.item(i).type);
                            var ind = words.indexOf(word);

                            // If its a pictograph from a previous word we do not
                            // create a new word. We simply add the picto to the
                            // previously created word.
                            if (ind>=0) {
                                compounds[ind]['pictos'].push({
                                    'picto': pictoName,
                                    'type': pictoType
                                })
                            } else {
                                words.push(word);
                                compounds.push({
                                    'word': word,
                                    'pictos': [{
                                        'picto': pictoName,
                                        'type': pictoType
                                    }]
                                })
                            }
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

        /**
         * Opens the data base
         */
        function startService() {

            document.addEventListener('deviceready', openDB, false);

            function openDB() {
                db = window.sqlitePlugin.openDatabase( {name: dbname, createFromLocation: 1} );
            }
        }

        /**
         * @returns {boolean} True if data base has been opened, otherwise false.
         */
        function ready() {
            return !angular.isUndefined(db);
        }

        /**
         * @param typeInText = { nombreComun, descriptivo, verbo, miscelanea, nombrePropio, contenidoSocial }
         * @returns {number} = Returns a unique identifier for each type of word.
         */
        function parseType(typeInText) {
            if (typeInText=="nombreComun") return 0;
            else if (typeInText=="descriptivo") return 1;
            else if (typeInText=="verbo") return 2;
            else if (typeInText=="miscelanea") return 3;
            else if (typeInText=="nombrePropio") return 4;
            else { return 5; }
        }
    };

})();

