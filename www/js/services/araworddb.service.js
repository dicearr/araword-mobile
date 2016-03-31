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

    araworddb.$inject = ['$cordovaSQLite','$q'];

    function araworddb($cordovaSQLite, $q) {

        var db = undefined;
        var db = undefined;
        var dbname = 'AraSuite.db'; // Pre filled db


        var service = {
            startService: startService,
            getWordsStartingWith: getWordsStartingWith,
            getVerbsStartingWith: getVerbsStartingWith,
            newPicto: newPicto,
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
            console.log('Searching for '+word.toLowerCase());
            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + word.toLowerCase() +" \%\'" +
                    " UNION SELECT * FROM ArawordView WHERE word=\'" + word.toLowerCase() +"\'";
                var compounds = [];
                var words = [];

                document.addEventListener('deviceready', function() {
                    executeQuery(compounds, words, query, resolve, reject);
                }, false);

            });
        }

        /**
         * Searches all the verbs that starts with the given form or it's infinitive.
         * @param form = Formed verb.
         * @param infinitive = verb in infinitive
         * @returns {*} Promise
         */
        function getVerbsStartingWith(form, infinitive) {

            return $q(function(resolve,reject){
                // Case insensitive
                var query = "SELECT * FROM ArawordView WHERE word like \'" + form.toLowerCase() +" \%\'" +
                    " UNION SELECT * FROM ArawordView WHERE word=\'" + form.toLowerCase() +"\'" +
                    " UNION SELECT * FROM ArawordView WHERE word like \'" + infinitive.toLowerCase() +" \%\'" +
                    " UNION SELECT * FROM ArawordView WHERE word=\'" + infinitive.toLowerCase() +"\'";

                var compounds = [];
                var words = [];

                document.addEventListener('deviceready', function() {
                    executeQuery(compounds, words, query, resolve, reject);
                }, false);

            });
        }

        function newPicto(word,picto) {
            return $q(function(resolve,reject) {
                var query = "INSERT INTO main(word, idL, idT, name) VALUES(?,?,?,?)";
                var params = [word.toLowerCase(),0,picto.type,picto.picto];

                document.addEventListener('deviceready', executeInsert);

                function executeInsert() {
                    $cordovaSQLite.execute(db,query,params)
                        .then(function() {
                            return resolve();
                        }, function(error) {
                            console.log(JSON.stringify(error));
                            return reject();
                        })
                }
            })
        }

        /**
         * Executes a query
         * @param compounds = vector where compound words will be pushed
         * @param words = vector where words will be pushed
         * @param query = query to be executed
         * @param resolve = promise resolve
         * @param reject = promise reject
         */
        function executeQuery(compounds, words, query, resolve, reject) {
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
            var types = ['nombreComun','descriptivo','verbo','miscelanea','nombrePropio','contenidoSocial'];
            return types.indexOf(typeInText);
        }

    };

})();

