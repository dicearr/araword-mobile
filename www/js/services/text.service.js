/**
 * Created by diego on 23/02/16.
 *
 * Manages changes in the text. Uses databases to get pictographs
 * and insert them into their words.
 */

(function(){
    'use strict';

    angular
        .module('AraWord')
        .factory('textAnalyzer', textAnalyzer);

    textAnalyzer.$inject = ['araworddb','$q','verbsdb'];

    function textAnalyzer(araworddb, $q, verbsdb){

        var radius = 3;
        var caretPosition = 0;
        var emptyPicto = {'picto':'','type':'3','base64':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8/58BAzAOZUEA5OUT9xiCXfgAAAAASUVORK5CYII='};
        var text = [];
        var errors = [];
        var lastCompound = {
            'time': 0,
            'text': ''
        };

        var service = {
            processEvent: processEvent,
            deleteWord: deleteWord,
            setCaret: setCaret,
            addEmptyWord: addEmptyWord,
            text: text,
            errors: errors,
            docName: ''
        };

        if(!verbsdb.ready()) {
            verbsdb.startService();
        }

        return service;

        //////////////////////////////

        /**
         * Modifies the tex by changing the words if it's required. For example
         * it detects new compound words.
         * @param w = The word that has been changed
         * @param text = The whole text
         * @param {Boolean} noPrevious - True means algorithm will not analyze previous words to look for compounds.
         */
        function processEvent(w, text, noPrevious) {

            var deferred = $q.defer();
            var ctx = {
                'values': [],
                'strings': [],
                'min': 0,
                'max': 0
            };
            initializeContext(ctx, text.indexOf(w));

            var promises = [], finalResult = [];
            ctx.values.forEach(function(word, position) {
                var defer = $q.defer();
                promises.push(defer.promise);
                var infinitives = undefined;
                var sanitized = sanitize(word);
                verbsdb.getInfinitive(sanitized)
                    .then(getVerbs, getWords)
                    .catch(deferred.reject)
                    .then(function(results) {
                        if (!results) {
                            finalResult.push({
                                'id': getId(),
                                'value': word,
                                'pictos': [emptyPicto],
                                'autofocus': false,
                                'pictInd': 0,
                                'words': 1
                            });
                        } else {
                            // If there are many verbs we've to generate all the sentences
                            // for each infinitive form.
                            if (!angular.isUndefined(infinitives)) {
                                generateStrings(ctx, infinitives, position);
                            }
                            ctx.strings.push(
                                ctx.values.slice(position, ctx.values.length)
                                    .map(sanitize).join(' ')
                                    .trim()
                            );

                            var finalWord = {
                                'id': getId(),
                                'value': word,
                                'pictos': [emptyPicto],
                                'autofocus': false,
                                'pictInd': 0,
                                'words': 1
                            };

                            //It will select the biggest compound that matches with our strings
                            results.forEach(function(tentative) {
                                ctx.strings.forEach(function(str) {
                                    var tentativeValue = tentative.word;
                                    var tentativeLength = tentativeValue.split(' ').length;
                                    if (str.indexOf(tentativeValue)==0 ) {
                                        if (tentativeLength > finalWord.words) {
                                            finalWord.value = tentativeValue;
                                            finalWord.pictos = tentative.pictos;
                                            finalWord.words = tentativeLength;
                                        } else if (tentativeLength == finalWord.words) {
                                            finalWord.pictos = tentative.pictos.concat(finalWord.pictos);
                                        }
                                    }
                                })
                            });

                            finalResult.push(finalWord);
                            ctx.strings = [];
                        }

                        defer.resolve();

                    }, function() {
                        finalResult.push({
                            'id': getId(),
                            'value': word,
                            'pictos': [emptyPicto],
                            'autofocus': false,
                            'pictInd': 0,
                            'words': 1
                        });
                        defer.resolve();
                    })
                    .catch(deferred.reject);

                function getVerbs(inf) {
                    infinitives = inf;
                    return araworddb.getVerbsStartingWith(sanitized, inf)
                }

                function getWords() {
                    return araworddb.getWordsStartingWith(sanitized);
                }
            });

            $q.all(promises)
                .then(function() {
                    for(var i=0; i<finalResult.length; i++) {
                        if (finalResult[i] && !equals(finalResult[i], text[ctx.min])) {
                            if (ctx.min<text.length) {
                                if (finalResult[i].words == 1) {
                                    if (lastCompound.text.lastIndexOf(finalResult[i].value)==-1
                                    || new Date().getTime()-lastCompound.time>1600) {
                                        text[ctx.min].value = finalResult[i].value;
                                        text[ctx.min].pictos = finalResult[i].pictos;
                                        text[ctx.min].autofocus = false;
                                        text[ctx.min].words = 1;
                                        text[ctx.min].divStyle = null;
                                    }
                                    lastCompound.text = lastCompound.text.replace(finalResult[i].value,'');
                                } else {
                                    lastCompound.time = new Date().getTime();
                                    lastCompound.text = finalResult[i].value;
                                    text.splice(ctx.min,finalResult[i].words,finalResult[i]);
                                    if (ctx.min==text.length-1) {
                                        setCaret(text, ctx.min);
                                    }
                                    i = i + finalResult[i].words - 1;
                                }
                            } else if (finalResult[i].words>1){
                                text.push(finalResult[i]);
                                i = i + finalResult[i].words -1;
                            } else {
                                if (lastCompound.text.lastIndexOf(finalResult[i].value)==-1) {
                                    for (var j=ctx.min-radius; j<i; j++) {
                                        if (text[j].value = finalResult[i].value && !equals(finalResult[i],text[j])) {
                                            text[j].value = finalResult[i].value;
                                            text[j].pictos = finalResult[i].pictos;
                                            text[j].autofocus = false;
                                            text[j].words = 1;
                                            text[j].divStyle = null;
                                        }
                                    }
                                }
                            }
                        } else {
                            if (finalResult[i]) {
                                i = i + finalResult[i].words -1;
                            }
                        }
                        ctx.min++;
                    }

                    deferred.resolve();
                });

            return deferred.promise;

            /**
             * Compares two pictographs.
             * @param pic1 = first pictograph.
             * @param pic2 = second pictograph.
             * @returns {boolean} True if pic1 is equal to pic2, otherwise false.
             */
            function equals(pic1, pic2) {
                if (!pic1 && pic2) return false;
                if (!pic2 && pic1) return false;
                if (!pic1 && !pic2) return true;
                if (pic1.value != pic2.value) return false;
                if (pic1.pictos.length > pic2.pictos.length) return false;
                if (pic1.pictos.length == 0 || (pic1.pictos.length == 1 && !pic1.pictos[0].picto)) return false;
                else {
                    var len = pic1.pictos.length;
                    for (var i=0; i<len; i++) {
                        if (pic1.pictos[len-i-1].picto != pic2.pictos[pic2.pictos.length-i-1].picto) return false;
                    }
                    return true;
                }
            }

            function sanitize(word) {
                return word.replace(/[.,:;]/g,'').toLowerCase().trim();
            }

            function initializeContext(ctx, pos) {
                var min = pos-radius>=0?pos-radius:0;
                var max = pos+radius<text.length?pos+radius:text.length-1;
                if (noPrevious) min = pos;
                for (var i=min; i<max+1; i++) {
                    if (text[i].value && (i==pos || (
                        text[i].words == 1
                        && text[i].value.length>0
                        && !text[i].unbind))
                    ) { // Compound word is made only by simple words
                        text[i].value.split(' ').forEach(function(simpleWord) { // But changed word could be compound
                            if (simpleWord) ctx.values.push(simpleWord);
                        });
                    } else if (i<pos) { // We do not break previous compound words
                        ctx.values = []; min = i+1;
                    } else if (i>pos) { // We do not consider later compound words
                        var aux = i;
                        i = max+1; max = aux-1;
                    }
                }
                ctx.min = min; ctx.max = max;
            }

            function generateStrings(ctx, infinitives, position) {
                var values = ctx.values.slice(position).map(sanitize);
                var text = values.join(" ").trim();
                if (infinitives.length>0) {
                    infinitives.forEach(function(inf) {
                        ctx.strings.push(text.replace(values[0],inf));
                    })
                } else {
                    ctx.strings.push(text);
                }
            }

        }


        /**
         * @param w = The word to be deleted.
         * @param text = The whole text.
         */
        function deleteWord(w, text) {
            var pos = text.indexOf(w);
            if (pos > -1 && text.length>1 ) {
                text.splice(pos, 1);
            } else if (pos==0) {
                text[pos]['pictos'][0] = emptyPicto;
                text[pos]['pictInd'] = 0;
            }
            setCaret(text, pos<=0?text.length-1:pos-1);
        }

        /**
         *
         * @param text
         * @param newCaretPosition
         */
        function setCaret(text, newCaretPosition) {
            // Can be a deleted word because of a compound
            if (!angular.isUndefined(text[caretPosition])) {
                text[caretPosition].autofocus = false;
            }
            text[newCaretPosition].autofocus = true;
            caretPosition = newCaretPosition;
        }

        /**
         * Inserts an empty word next to the given word.
         * @param word = The previous word
         * @param text = The whole text
         */
        function addEmptyWord(word, text) {

            var pos = text.indexOf(word)+1;

            text.splice(pos,0,{
                'id': getId(),
                'value': '',
                'pictos': [emptyPicto],
                'pictInd': 0,
                'words': 1
            });

            setCaret(text, pos);
        }

        function getId() {
            // Math.random should be unique because of its seeding algorithm.
            // Convert it to base 36 (numbers + letters), and grab the first 9 characters
            // after the decimal.
            return '_' + Math.random().toString(36).substr(2, 9);
        }

    }
})();
