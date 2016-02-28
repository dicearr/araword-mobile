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
        var caretPosition = 0;

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            setCaret: setCaret
        };

        pictManager.startService();

        return service;

        //////////////////////////////

        function processEvent(w, text, event) {

            var wordPosition = text.indexOf(w);
            var char = String.fromCharCode(event.keyCode);
            var changePosition = w.value.lastIndexOf(char);
            var textContext = [];

            // Usual case
            if (separators.indexOf(event.keyCode)>=0 && // is a separator
                     changePosition == w.value.length-1 ) { // at the end of the word
                w.value = w.value.trim();
                push_empty_word(); // We add new empty word
                setCaret(text,wordPosition+1); // We set the caret
            } else {
                textContext = getTextContext(wordPosition, radius);
                var wordsInContext = textContext.words;

                var promises = [];
                var results = [];
                wordsInContext.forEach(function(simpleWord) {
                    promises.push(
                        $q(function(resolve) {
                            dbService.getCompoundsStartingWith(simpleWord.value)
                                .then(function (compounds) {
                                    var wordsValuesInContext = wordsInContext.map(function(word) {
                                       if (!angular.isUndefined(word)) return word.value;
                                    });
                                    var text = wordsValuesInContext.slice(simpleWord.position, wordsValuesInContext.length).join(' ');
                                    var match = {
                                        'value': simpleWord.value,
                                        'pictos': [],
                                        'words': 1
                                    };
                                    for(var i=0; i<compounds.length; i++) {
                                        if (text.indexOf(compounds[i])==0 &&
                                                (text.charAt(compounds[i].length)==' ' ||
                                                text.length <= compounds[i].length )) {
                                            var newLength = compounds[i].split(' ').length;
                                            if (match == null || newLength > match.words) {
                                                match = {
                                                    'value': compounds[i],
                                                    'pictos': [],
                                                    'words': newLength
                                                };
                                            }
                                        }
                                    }
                                    pictManager.getPictPaths(match.value)
                                        .then(function(paths) {
                                            match.pictos = paths;
                                            results[simpleWord.position] = match;
                                            resolve();
                                        }, function() {
                                            results[simpleWord.position] = match;
                                            resolve();
                                        });
                                }, function () {
                                    pictManager.getPictPaths(simpleWord.value)
                                        .then(function(paths) {
                                            results[simpleWord.position] = {
                                                'value': simpleWord.value,
                                                'pictos': paths,
                                                'words': 1
                                            };
                                            resolve();
                                        },function() {
                                            results[simpleWord.position] = {
                                                'value': simpleWord.value,
                                                'pictos': ['img/logo.png'],
                                                'words': 1
                                            };
                                            resolve();
                                        });
                                });
                        })
                    );
                });

                $q.all(promises).then(function() {
                    text.splice(textContext.minIndex,textContext.maxIndex-textContext.minIndex+1);
                    for(var i=0; i<results.length; i++) {
                        text.splice(textContext.minIndex++,0,results[i]);
                        i = i + results[i].words - 1;
                    }
                    setCaret(text,textContext.minIndex-1);
                });

            }

            /////////////////

            function getTextContext(pos, rad) {
                var minIndex = 0;
                var maxIndex = text.length-1;

                if (pos-rad>0) { minIndex = pos-rad; }
                if (pos+rad<maxIndex) { maxIndex = pos+rad; }

                var words = [];
                var j = 0;

                for(var i=minIndex; i<maxIndex+1; i++) {
                    if (i==pos || text[i].words == 1) { // Compound word is made by simple words
                        text[i].value.split(' ').forEach(function(simpleWord) { // But changed word could be compound
                            words.push({
                                'value': simpleWord,
                                'position': j
                            });
                            j++;
                        });
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
                    'value': '',
                    'pictos': [],
                    'words': 1
                };
                text.splice(wordPosition+1,0,emptyWord);
            }

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
            setCaret(text, pos==0?pos:pos-1);
        }

        /**
         *
         * @param text
         */
        function setCaret(text, newCaretPosition) {
            // Can be a deleted word because of a compound
            if (!angular.isUndefined(text[caretPosition])) {
                text[caretPosition].autofocus = false;
            }
            text[newCaretPosition].autofocus = true;
            caretPosition = newCaretPosition;
        }

    }
})();
