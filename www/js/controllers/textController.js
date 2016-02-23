/**
 * Created by diego on 17/02/16.
 */
(function(){

    'use strict';

    angular
        .module('app')
        .controller('textController', textController);

    textController.$inject = ['pictManager','pictUpdater'];

    function textController(pictManager, pictUpdater) {

        var vm = this;
        vm.myText = [{
            'id': getId(),
            'value': 'AraWord',
            'pictos': ['img/logo.png']
        }];
        vm.if_empty_delete = if_empty_delete;
        vm.change = change;

        pictManager.startService();
        pictUpdater.unzip()
            .then(function(success){
               console.log(JSON.stringify(success));
            },function(err) {
                console.log(JSON.stringify(err));
            });

        //////////////

        /**
         * @returns {number} Pseudo random number.
         */
        function getId() {
            return Math.floor(Math.random() * 10000000);
        };


        /**
         * Deletes a word in the text.
         * @param w = Word to be deleted.
         */
        function deleteWord(w) {
            var pos = vm.myText.indexOf(w);
            if (pos > -1 && vm.myText.length>1 ) {
                vm.myText.splice(pos, 1);
            }
        };

        /**
         * Puts the cursor in the last word by setting the autofocus directive
         * to TRUE.
         */
        function focus() {
            var aux = vm.myText.pop();
            aux.autofocus = true;
            vm.myText.push(aux);
        };

        /**
         * Executed when key-up. Deletes the model if the word is empty.
         * @param w = The word's model we're working with.
         * @param e = The event happened.
         */
        function if_empty_delete(w,e) {
            if (w.value.length==0 && e.keyCode == 8) {
                deleteWord(w);
                focus();
            }
        };

        /**
         * Executed when text changes..
         */
        function change(w) {
            var ind = w.value.lastIndexOf(' ');
            if (ind >= 0) {
                var oldWord = w.value.substring(0, ind);
                var newWord = w.value.substring(ind + 1, w.value.length);

                pictManager.getPictPaths(oldWord)
                    .then(function(oldPaths) {
                        vm.myText.push({
                            'id': getId(),
                            'value': oldWord,
                            'pictos': oldPaths });
                        deleteWord(w); // Original word is not needed anymore
                    },function(error) {
                        console.log(JSON.stringify(error));
                    });

                pictManager.getPictPaths(newWord)
                    .then(function(newPaths) {
                        vm.myText.push({
                            'id': getId(),
                            'value': newWord,
                            'pictos': newPaths });
                        focus(); // Cursor must be in the last word
                    },function(error) {
                            console.log(JSON.stringify(error));
                    });
            }
            if (w.value == '') {
                deleteWord(w);
                focus();
            }

        };
    }
})();