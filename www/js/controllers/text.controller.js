/**
 * Created by diego on 17/02/16.
 *
 * Main controller. Manages the whole text analysis and almost all
 * functionalities.
 */
(function(){

    'use strict';

    angular
        .module('AraWord')
        .controller('textController', textController);

    // Using $scope is not recomended, but I need $scope.$apply() in nextPicto()
    textController.$inject = ['textAnalyzer','configService',
        '$cordovaFile','araworddb','$scope',
        '$ionicPopup', 'IonicClosePopupService',
        '$cordovaSocialSharing','accessService',
        '$cordovaImagePicker','docsService','$timeout'];

    function textController(textAnalyzer, configService,
                            $cordovaFile, araworddb,
                            $scope, $ionicPopup, IonicClosePopupService,
                            $cordovaSocialSharing, accessService, $cordovaImagePicker,
                            docsService, $timeout) {


        var vm = this;
        vm.myText = [{
            'value': 'AraWord',
            'pictos': [{'picto':'25748.png', 'type':4}],
            'pictInd': 0,
            'words': 1,
            'autofocus': true
        }];
        vm.onChange = onChange;
        vm.onKeyUp = onKeyUp; // Deletes empty words
        // Manages double/single click by using timeout
        vm.singleClickAction = singleClickAction;

        /* Text to speech functions */
        vm.readText = readText;  // Whole text
        vm.readPicto = readPicto; // One word

        configService.restoreConfig();

        vm.conf = configService;
        vm.showOptions = showOptions;

        accessService.restoreConfig();

        vm.acc = accessService;
        vm.shareText = shareText;

        vm.modifyText = modifyText;
        vm.pickImage = pickImage;
        vm.optionsPopup = undefined;

        textAnalyzer.text = vm.myText;

        vm.sendDocument = sendDocument;

        if(! araworddb.ready()) {
            araworddb.startService();
        }

        $scope.$on('reloadText', function(event, value) {
            vm.myText.forEach(function(word,ind) {
                $timeout(function() {
                    textAnalyzer.processEvent(word, vm.myText);
                },7);
            })
        });

        //////////////

        function shareText() {

            var message = document.getElementById('text');

            html2canvas(message, {
                background: 'white',
                onrendered: function(canvas) {
                    var image = canvas.toDataURL("image/jpeg");
                    $cordovaSocialSharing
                        .share(null, null, image, null) // Share via native share sheet
                        .then(function(result) {
                            console.log(JSON.stringify(result));
                        }, function(err) {
                            console.log(JSON.stringify(err));
                        });
                }
            })
        }

        /**
         * @param word = word in which change has happened
         */
        function onChange(word) {
            if(angular.isUndefined(word.unbind) || !word.unbind) {
                // Common case
                var canAnalyze = true;
                if (word.value.charAt(word.value.length-1)==' ') {
                    vm.message = 'separator';
                    word.value = word.value.substr(0,word.value.length-1);
                    canAnalyze &= word.words==1;
                }

                if (word.value.length==0) {
                    textAnalyzer.deleteWord(word,vm.myText);
                } else if (canAnalyze){
                    textAnalyzer.processEvent(word, vm.myText);
                }
            }
        }

        /**
         * Reads the image from the file system.
         * @param picto = The picto we've to read.
         */
        function readPicto(picto) {

            // Digest cycles are faster than read fs so we return empty picto to avoid multiple reads
            if (picto && !picto['base64'])
                picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

            if (picto)
                document.addEventListener('deviceready', readPictHandler, false);

            function readPictHandler() {

                var dirUrl = cordova.file.dataDirectory;
                var dirName = 'pictos/';

                $cordovaFile.readAsDataURL(dirUrl+dirName, picto['picto'])
                    .then(function(success){
                        picto['base64'] = success;
                    },function(err){
                        picto['base64'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                    });


            }

        }

        /**
         * $scope.$apply() used to troubleshoot singleActionClick()
         * @param word = The word whose picto must change.
         */
        function nextPicto(word) {
            word.pictInd = (word.pictInd+1)%word.pictos.length;
            $scope.$apply();
        }

        /**
         * If the word is empty, it will be deleted
         * @param word = The word that must be checked.
         */
        function onKeyUp(event, word) {
            if (event.target.value.length==0) {
                textAnalyzer.deleteWord(word,vm.myText);
            } else if (
                ( event.target.value === word.value+" "
                || word.value == ""
                && (event.target.value.charAt(event.target.value.length-1) == ' '))) { // event.keyCode doesn't work. Workaround.
                textAnalyzer.addEmptyWord(word,vm.myText);
            }
        }

        /**
         * Reads a word
         * @param word = The word to be read.
         */
        function readWord(word) {
            TTS.speak({
                text: word.value,
                locale: 'es-ES',
                rate: 1.1
            }, function(success) { console.log(JSON.stringify(success)) },
                function(error) { console.log(JSON.stringify(error)) })
        }

        // Used in singleClickAction to manage double clicks
        var waitingForSecondClick = false;
        var executingDoubleClick = false;

        /**
         * Manages single/double click changin the image or reading the text
         * depending on the event.
         * @param word = The word which has been clicked.
         * @returns {*} void
         */
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

        /**
         * SingleClick callback
         * @param word = the word which has been clicked
         * @param executingDoubleClick = true if doble click occurs during the timeout
         */
        function singleClickOnlyAction(word, executingDoubleClick) {
            if (executingDoubleClick) return;
            nextPicto(word)
        }

        /**
         * DoubleClick callback
         * @param word  = the word which has been double clicked
         */
        function doubleClickAction(word) {
            readWord(word);
        }

        /**
         * Concatenates the full text and reads it.
         */
        function readText() {
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

        /**
         * Displays the options popup for a word.
         * @param word
         */
        function showOptions(word) {
           vm.selectedWord = word;
           vm.optionsPopup =  $ionicPopup.show({
                templateUrl: 'templates/popups/pictos.html',
                title: 'Options',
                scope: $scope
            });
            $scope.myPopup = vm.optionsPopup;
            IonicClosePopupService.register($scope.myPopup);
        }

        function sendDocument() {
            docsService.saveDoc(vm.myText,null,'tmp_mail')
                .then(function(data) {
                    if (!data.target.error) {
                        resolveLocalFileSystemURL(data.target.localURL, function(entry) {
                            var nativePath = entry.toURL();
                            window.plugins.socialsharing.shareViaEmail(
                                'Enviado desde Araword móvil.', // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
                                'Documento Araword',
                                null, // TO: must be null or an array
                                null, // CC: must be null or an array
                                null, // BCC: must be null or an array
                                [nativePath], // FILES: can be null, a string, or an array
                                function() {
                                    $cordovaFile.removeFile(cordova.file.externalDataDirectory,'tmp_mail.awz');
                                }, // called when sharing worked, but also when the user cancelled sharing via email. On iOS, the callbacks' boolean result parameter is true when sharing worked, false if cancelled. On Android, this parameter is always true so it can't be used). See section "Notes about the successCallback" below.
                                function(error) {
                                    console.log(JSON.stringify(error))
                                }
                            )
                        });
                    }
                });

        }

        /**
         * Displays the image picker.
         */
        function pickImage() {
            $cordovaImagePicker.getPictures({'maximumImagesCount': 1})
                .then(function(result){
                    vm.optionsPopup.close();
                    var separator = result[0].lastIndexOf('/');
                    var path = result[0].substr(0,separator);
                    var file = result[0].substr(separator+1);
                    var dirUrl = cordova.file.applicationStorageDirectory;
                    var dirName = 'pictos/pictos_12';
                    var type = undefined;
                    $cordovaFile.readAsDataURL(path,file)
                        .then(function(res){
                            type = vm.selectedWord.pictos[vm.selectedWord.pictInd].type;
                            if (angular.isUndefined(type)) {
                                type = 3;
                            }
                            araworddb.newPicto(vm.selectedWord.value,{'picto':file,'type':type})
                                .then(function() {
                                    vm.selectedWord.pictos = [{'picto':file,'type':type,'base64':res}].concat(vm.selectedWord.pictos);
                                    vm.selectedWord.pictInd = 0;
                                })
                        });
                    $cordovaFile.copyFile(path,file,dirUrl+dirName,file);
                });
        }

        /**
         * Allows user to modify a text without modifying pictographs
         */
        function modifyText() {
            vm.selectedWord['unbind'] = true;
            vm.optionsPopup.close();
            textAnalyzer.setCaret(vm.myText,vm.myText.indexOf(vm.selectedWord));
        }

    }
})();