/**
 * Created by diego on 23/02/16.
 */

(function(){
    'use strict';

    angular
        .module('app')
        .factory('textAnalyzer', textAnalyzer);

    textAnalyzer.$inject = ['pictManager','$q','dbService'];

    function textAnalyzer(pictManager, $q, dbService){

        var radius = 3;
        var separators = [32,9,13]; // space, tab, enter

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            focusLastWord: focus
        };

        pictManager.startService();

        return service;

        //////////////////////////////

        function processEvent(w, text, event) {

            var wordPosition = text.indexOf(w);
            var char = String.fromCharCode(event.keyCode);
            var changePosition = w.value.indexOf(char);
            var textContext = [];

            // Usual case
            if (separators.indexOf(event.keyCode)>=0 && // is a separator
                     changePosition == w.value.length-1 ) { // at the end of the word
                console.log('ADD_EMPTY_WORD');
                w.value = w.value.trim();
                w.autofocus = false;
                push_empty_word(); // We add new empty word
                focus(text); // We set the caret
            } else {
                console.log('PARSING_TEXT');
                textContext = getTextContext(wordPosition, radius);
                console.log('CONTEXT='+JSON.stringify(textContext));
                var wordsInContext = textContext.words;

                var promises = [];
                var results = [];
                wordsInContext.forEach(function(simpleWord) {
                    console.log('SEARCHING_COMPOUND_FOR: '+JSON.stringify(simpleWord));
                    promises.push(
                        $q(function(resolve) {
                            dbService.getCompoundsStartingWith(simpleWord.value)
                                .then(function (compounds) {
                                    console.log('COMP='+JSON.stringify(compounds));
                                    var text = wordsInContext.slice(simpleWord.position, wordsInContext.length).join(' ');
                                    console.log('TEXT='+text);
                                    var match = null;
                                    for(var i=0; i<compounds.lenght; i++) {
                                        if (text.indexOf(compounds[i])==0) {
                                            var newLength = compounds[i].split(' ').length;
                                            if (match == null || newLength > match.words) {
                                                  console.log('MATCH='+compounds[i]+' LEN='+newLength);
                                                match = {
                                                    'id': getId(),
                                                    'value': compounds[i],
                                                    'pictos': [],
                                                    'words': newLength
                                                }
                                            }
                                        }
                                    }
                                    pictManager.getPictPaths(match.value)
                                        .then(function(paths) {
                                            match.pictos = paths;
                                            results[simpleWord.position] = match;
                                            resolve();
                                        });
                                    results[simpleWord.position] = match;
                                    resolve();
                                }, function () {
                                    pictManager.getPictPaths(simpleWord.value)
                                        .then(function(paths) {
                                            results[simpleWord.position] = {
                                                'id': getId(),
                                                'value': simpleWord.value,
                                                'pictos': paths,
                                                'lenght': 1
                                            };
                                            resolve();
                                        });
                                });
                        })
                    );
                });

                $q.all(promises).then(function() {
                    console.log('RESULTS='+JSON.stringify(results));
                    for(var i=0; i<results.length; i++) {
                        if (results[i].words > 1) {
                            results = results.splice(i+1,results[i].words-1);
                        }
                        text.splice(textContext.minIndex,0,results[i]);
                        textContext.minIndex++;
                    }
                });

            }

            /////////////////

            function getTextContext(pos, rad) {
                console.log('POS='+pos);
                console.log('RAD='+rad);
                console.log('TEXT='+JSON.stringify(text));
                var minIndex = 0;
                var maxIndex = (text.lenght-1);

                if (pos-rad>0) { minIndex = pos-rad; }
                if (pos+rad<maxIndex) { maxIndex = pos+rad; }

                var words = [];
                var j = 0;

                for(var i=minIndex; i<maxIndex+1; i++) {
                    if (i==pos || text[i].words == 1) { // Compound word is made by simple words
                        console.log('pushing:'+text[i].value);
                        words.push({
                            'value': text[i].value,
                            'position': j
                        });
                        j++;
                    } else if (i<pos && text[i].words > 1) { // We do not break previous compound words
                        words = []; j = 0; minIndex = i+1;
                    } else if (i>pos && text[i].words > 1) { // We do not consider later compound words
                        var aux = i;
                        i = maxIndex+1; maxIndex = aux-1;
                    }
                }

                return {
                    'minIndex': minIndex,
                    'maxIndex': maxIndex,
                    'words': words
                };
            }

            function push_empty_word() {
                var emptyWord = {
                    'id': getId(),
                    'value': '',
                    'pictos': [],
                    'words': 1
                };
                text.splice(wordPosition+1,0,emptyWord);
            }

        }

        /**
         * @returns {number} Pseudo random number.
         */
        function getId() {
            return Math.floor(Math.random() * 10000000);
        }


        /**
         *
         * @param w
         * @param text
         */
        function deleteWord(w, text) {
            var pos = text.indexOf(w);
            if (pos > -1 && text.length>1 ) {
                text.splice(pos, 1);
            }
        }

        /**
         *
         * @param text
         */
        function focus(text) {
            var aux = text.pop();
            aux.autofocus = true;
            text.push(aux);
        }

    }
})();
