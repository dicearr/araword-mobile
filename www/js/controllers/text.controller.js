/**
 * Created by diego on 17/02/16.
 */
(function(){

    'use strict';

    angular
        .module('app')
        .controller('textController', textController);

    textController.$inject = ['textAnalyzer','configService','$cordovaFile','dbService','$scope'];

    function textController(textAnalyzer, configService, $cordovaFile, dbService, $scope) {

        var vm = this;
        vm.myText = [{
            'value': 'AraWord',
            'pictos': [{'picto':'25748.png', 'type':4}],
            'pictInd': 0,
            'words': 1,
            'autofocus': true
        }];
        vm.onChange = onChange;
        vm.deleteIfEmpty = deleteIfEmpty;
        vm.singleClickAction = singleClickAction;
        vm.readText = readText;

        configService.restoreConfig();

        vm.pictoStyle = configService.pictoStyle;
        vm.wordStyle = configService.wordStyle;
        vm.getDivStyle = configService.getDivStyle;
        vm.wordPosition = wordPosition;

        vm.readPicto = readPicto;

        if(! dbService.ready()) {
            dbService.startService();
        }

        //////////////

        function onChange(word) {
            // Common case
            if (word.value.charAt(word.value.length-1)==' ') {
                textAnalyzer.addEmptyWord(word,vm.myText);
            }
            // Delete word
            else if (word.value.length==0) {
                textAnalyzer.deleteWord(word,vm.myText);
            }
            // Analysis needed
            else {
                textAnalyzer.processEvent(word, vm.myText);
            }
        }

        function wordPosition() {
            return configService.wordPosition;
        }

        function readPicto(picto) {

            // Digest cycles are faster than read fs so we return empty picto to avoid multiple reads
            picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            document.addEventListener('deviceready', readPictHandler, false);

            function readPictHandler() {

                var dirUrl = cordova.file.dataDirectory;
                var dirName = 'pictos';

                $cordovaFile.readAsDataURL(dirUrl+dirName+'/pictos_12', picto['picto'])
                    .then(function(success){
                        picto['base64'] = success;
                    },function(err){
                        console.log(JSON.stringify(err));
                        picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                    });
            }

        }

        function nextPicto(word) {
            word.pictInd = (word.pictInd+1)%word.pictos.length;
            $scope.$apply();
        }

        function deleteIfEmpty(word) {
            if (word.value.length==0) textAnalyzer.delteWord(word, vm.myText);
        }

        function readWord(word) {
            TTS.speak({
                text: word.value,
                locale: 'es-ES',
                rate: 0.75
            }, function() {
                TTS.speak('');
            }, function() {
                TTS.speak('');
            })
        }

        var waitingForSecondClick = false;
        var executingDoubleClick = false;

        function singleClickAction(word) {
            var myWord = word;

            executingDoubleClick = false;
            if (waitingForSecondClick) {
                executingDoubleClick = true;
                waitingForSecondClick = false;
                return doubleClickAction(myWord);
            }
            waitingForSecondClick = true;

            setTimeout(function() {
                waitingForSecondClick = false;
                return singleClickOnlyAction(myWord, executingDoubleClick);
            }, 270); // delay
        }

        function singleClickOnlyAction(word, executingDoubleClick) {
            if (executingDoubleClick) return;
            nextPicto(word)
        }

        function doubleClickAction(word) {
            readWord(word);
        }

        function readText() {
            console.log('reading');
            var text = '';
            for(var i=0; i<vm.myText.length; i++){
                text += vm.myText[i].value;
            }

            TTS.speak({
                text: text,
                locale: 'es-ES',
                rate: 0.75
            }, function() {
                TTS.speak('');
            }, function() {
                TTS.speak('');
            })
        }

    }
})();