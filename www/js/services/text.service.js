/**
 * Created by diego on 23/02/16.
 */

(function(){
    'use strict';

    angular
        .module('app')
        .factory('textAnalyzer', textAnalyzer);

    textAnalyzer.$inject = ['dbService','$q','verbsDB'];

    function textAnalyzer(dbService, $q, verbsDB){

        var radius = 3;
        var separators = [32,9,13]; // space, tab, enter
        var caretPosition = 0;
        var emptyPicto = {'picto':'','type':'3','base64':'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='};

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            setCaret: setCaret
        };

        if(!verbsDB.ready()) {
            verbsDB.startService();
        }

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
                var wordsValuesInContext = wordsInContext.map(function(word) {
                    if (!angular.isUndefined(word)) return word.value.toLowerCase();
                });

                var promises = [];
                var results = [];

                wordsInContext.forEach(function(simpleWord) {
                    var inf = undefined;
                    promises.push(
                        $q(function(resolve) {
                            var promise = verbsDB.getInfinitive(simpleWord.value)
                                .then(function(infinitive){
                                    inf = infinitive;
                                    return dbService.getCompoundsStartingWith(infinitive);
                                }, function() {
                                    return dbService.getCompoundsStartingWith(simpleWord.value);
                                });

                            promise
                                .then(function(compounds) {
                                    if (!angular.isUndefined(inf)) {
                                        wordsValuesInContext.splice(simpleWord.position,1,inf);
                                        console.log(JSON.stringify(wordsValuesInContext));
                                    }
                                    var text = wordsValuesInContext.slice(simpleWord.position, wordsValuesInContext.length).join(' ');
                                    console.log(text);
                                    var match = {
                                        'value': simpleWord.value,
                                        'pictos': [emptyPicto],
                                        'pictInd': 0,
                                        'words': 1
                                    };

                                    for(var i=0; i<compounds.length; i++) {
                                        var comp = compounds[i];
                                        var len = comp.word.length;
                                        if (text.indexOf(comp.word)==0 &&
                                            (text.charAt(len)==' ' ||
                                            (text.length <= len))) {
                                            var newLength = comp.word.split(' ').length;
                                            if (match == null || newLength >= match.words) {
                                                match = {
                                                    //Allows Upper Case in text, com.word is lower case
                                                    'value': newLength==1?simpleWord.value:comp.word,
                                                    'pictos': comp.pictos,
                                                    'pictInd': 0,
                                                    'words': newLength
                                                };
                                            }
                                        }
                                    }
                                    results[simpleWord.position] = match;
                                    resolve();
                                }, function () {
                                    results[simpleWord.position] = {
                                        'value': simpleWord.value,
                                        'pictos': [emptyPicto],
                                        'pictInd': 0,
                                        'words': 1
                                    };
                                    resolve();
                                });
                        })
                    );
                });

                $q.all(promises).then(function() {
                    text.splice(textContext.minIndex,textContext.maxIndex-textContext.minIndex+1);
                    var caret = 0;
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
                    'pictos': [emptyPicto],
                    'pictInd': 0,
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
