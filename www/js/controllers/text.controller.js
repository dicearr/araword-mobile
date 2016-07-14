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

    textController.$inject = ['textAnalyzer','configService',
        '$cordovaFile','$scope',
        '$ionicPopup', 'IonicClosePopupService',
        '$cordovaSocialSharing','accessService',
        '$cordovaImagePicker','docsService','$timeout','$ionicScrollDelegate',
        '$ionicPlatform', '$ionicHistory','popupsService','pictoService','$filter'];

    /**
     * Controller
     * @param textAnalyzer - Required to process text changes
     * @param configService - Required to access configuration parameters as language
     * @param $cordovaFile - Required to read pictographs from files
     * @param $scope - Required to access to the controller from the popups
     * @param $ionicPopup - Required to show the popups TODO: Use poupService
     * @param IonicClosePopupService - Required to automatically close popups when user taps outside
     * @param $cordovaSocialSharing - Required to share awz documents through social media
     * @param accessService - Required to know which functionalities are available
     * @param $cordovaImagePicker - Required to select an image from device
     * @param docsService - Required to save/load documents
     * @param $timeout - Required to delay some functions html2canvas for example
     * @param $ionicScrollDelegate - Required to move scroll to top when html2canvas
     * @param $ionicPlatform - Required to close the app
     * @param $ionicHistory - Required to know in which state we are
     * @param popupsService - Required to show the popups
     * @param pictoService - Required to update pictographs
     * @param $filter - Required to translate some text
     */
    function textController(textAnalyzer, configService, $cordovaFile, $scope, $ionicPopup, IonicClosePopupService,
                            $cordovaSocialSharing, accessService, $cordovaImagePicker, docsService, $timeout,
                            $ionicScrollDelegate, $ionicPlatform, $ionicHistory, popupsService, pictoService,
                            $filter) {

        var vm = this;

        /**
         * All the information needed from pictographs
         * @typedef {Object} picto - The pictograph we've to read.
         * @property {String} picto.base64 -  The pictograph read as data url
         * @property {String} picto.type - The pictographs type
         * @property {String} picto.picto - The pictographs file name
         */

        /**
         * All the information needed from words
         * @typedef {Object} word - word in which change has happened
         * @property {String} word.value - The word itself
         * @property {Array} word.pictos - All the pictos related to the word
         * @property {Number} word.words - The length of the word in words (To do = 2)
         * @property {Number} word.pictInd - The current pictograph index from word.pictos
         * @property {Boolean} word.autofocus - True if the caret is currently set on the word
         */
        vm.myText = [{
            'id': getId(),
            'value': 'AraWord',
            'pictos': [{'picto':'25748.png', 'type':4}],
            'pictInd': 0,
            'words': 1,
            'autofocus': true
        }];

        $ionicPlatform.onHardwareBackButton(function() {
            if ($ionicHistory.currentStateName()=='text') {
                ionic.Platform.exitApp();
            }
        });

        var emptyPicto = {'picto':'','type':'3','base64':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8/58BAzAOZUEA5OUT9xiCXfgAAAAASUVORK5CYII='};


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

        $scope.$on('reloadText', function() {
            vm.myText.forEach(function(word) {
                textAnalyzer.processEvent(word, vm.myText, true)
                    .then(insertResults, function(e){
                        console.log('ERROR',JSON.stringify(e));
                    });
            });
        });

        var lastCompound = {
            'time': 0,
            'text': '',
            'ids': []
        };

        vm.newDocument = newDocument;

        document.addEventListener('deviceready', function(){
            var HandleIntent = function (intent) {

                if(intent.hasOwnProperty('data')){
                    if (intent.data.indexOf('content://')==0) {
                        window.FilePath.resolveNativePath(intent.data, function(result) {
                            var uri = 'file://' + result;
                            var ind = uri.lastIndexOf('/');
                            var docName = uri.substr(ind+1);
                            var path = uri.substr(0,ind);
                            docsService.openDoc(path,docName);
                        }, function () {
                            // TODO: Content provider for content://gmail-ls URIs
                            $ionicPopup.alert({
                                'title': '<h1>Error</h1>',
                                'template': '<p translate="open_err">Cannot open file. Please open it from any file browser</p>'
                            })
                        });
                    } else {
                        var ind = intent.data.lastIndexOf('/');
                        var docName = intent.data.substr(ind+1);
                        var path = intent.data.substr(0,ind);
                        docsService.openDoc(path,docName);
                    }

                }
            };

            // Handle the intent when the app is open
            // If the app is running in the background, this function
            // will handle the opened file
            window.plugins.intent.setNewIntentHandler(HandleIntent);

            // Handle the intent when the app is not open
            // This will be executed only when the app starts or wasn't active
            // in the background
            window.plugins.intent.getCordovaIntent(HandleIntent, function () {
                alert("Error: Cannot handle open with file intent");
            });
        }, false);

        //////////////

        /**
         * Shows a popup to save the current document and creates a new blank
         * Araword document.
         */
        function newDocument() {
            $scope.data = {
                docName: textAnalyzer.docName
            };
            var saveDoc = popupsService.saveDocument;
            saveDoc.onSave = function (e) {
                if (!$scope.data.docName) {
                    e.preventDefault();
                } else {
                    docsService.saveDoc(textAnalyzer.text, null, $scope.data.docName);
                }
            };
            var promise = saveDoc.show($scope,true);
            promise.then(function() {
                textAnalyzer.docName = '';
                vm.myText = [{
                    'id': getId(),
                    'value': 'AraWord',
                    'pictos': [{'picto':'25748.png', 'type':4}],
                    'pictInd': 0,
                    'words': 1,
                    'autofocus': true
                }];
                textAnalyzer.text = vm.myText;
            })
        }

        /**
         * Sends the Araword document as an image through social media
         */
        function shareText() {
            $timeout(function() {
                $ionicScrollDelegate.$getByHandle('content').scrollTop();
                $timeout(function() {
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
                }, 40); // Time to render correctly
            },5); // Time to compile the content
        }

        /**
         * Executed when any change occurs
         * @param {word} word - The word in which change has occurred
         */
        function onChange(word) {
            if (word.empty) {
                word.empty = false;
            } else {
                if(angular.isUndefined(word.unbind) || !word.unbind) {
                    word.value = word.value.trim();
                    // It does not analyze empty words
                    if (word.value) {
                        if (word.value.length==0) {
                            textAnalyzer.deleteWord(word,vm.myText);
                        } else {
                            console.log('CHANGE',word.value);
                            textAnalyzer.processEvent(word, vm.myText)
                                .then(insertResults, function(e){
                                    console.log('ERROR',JSON.stringify(e));
                                });
                        }
                    }
                }
            }
        }

        function insertResults(data) {
            var ctx = data.context, finalResult = data.result;
            for(var i=0; i<finalResult.length; i++) {
                if (finalResult[i] && !equals(finalResult[i], vm.myText[ctx.min])) {
                    if (ctx.min<vm.myText.length) {
                        // Simple word converted into another simple word...
                        if (finalResult[i].words==1 && vm.myText[ctx.min].words==1) {
                            if (lastCompound.ids.indexOf(finalResult[i].id)==-1) {
                                vm.myText[ctx.min].value = finalResult[i].value;
                                vm.myText[ctx.min].pictos = finalResult[i].pictos;
                                vm.myText[ctx.min].autofocus = false;
                                vm.myText[ctx.min].words = 1;
                                vm.myText[ctx.min].divStyle = null;
                            }
                        }
                        // New compound word
                        else if (finalResult[i].words>1) {
                            lastCompound.ids = [];
                            var words = finalResult[i].value.split(' ');
                            var changed = false;
                            for (var k=0;k<finalResult[i].words && !changed; k++) {
                                lastCompound.ids.push(vm.myText[ctx.min+k].id);
                                if (document.getElementById(vm.myText[ctx.min+k].id)
                                    && document.getElementById(vm.myText[ctx.min+k].id).value != words[k]) {
                                    console.log('DIFF',document.getElementById(vm.myText[ctx.min+k].id).value,words[k]);
                                    changed = true;
                                }
                            }
                            if (changed) {
                                lastCompound.ids = [];
                            } else {
                                vm.myText.splice(ctx.min,finalResult[i].words,finalResult[i]);
                                if (ctx.min==vm.myText.length-1) {
                                    textAnalyzer.setCaret(vm.myText, ctx.min);
                                }
                                i = i + finalResult[i].words - 1;
                            }
                        }
                        // Compound word decomposed
                        else {
                            for(var jj=i; jj<finalResult.length; jj++) {
                                finalResult[jj].autofocus = false;
                                finalResult[jj].words = 1;
                                finalResult[jj].divStyle = null;
                                finalResult[jj].id = getId();
                            }

                            var len = vm.myText[ctx.min].words;
                            var newPictos = finalResult.slice(i,i+len);
                            vm.myText.splice.apply(vm.myText, [ctx.min,1].concat(newPictos));
                            i += len;
                            newPictos = [];
                        }
                    } else if (finalResult[i].words>1){
                        vm.myText.push(finalResult[i]);
                        i = i + finalResult[i].words -1;
                    } else {
                        if (lastCompound.ids.indexOf(finalResult[i].id)==-1) {
                            var located;
                            for (var j=ctx.min-textAnalyzer.radius; j<i; j++) {
                                if (vm.myText[j]
                                    && vm.myText[j].value == finalResult[i].value && !equals(finalResult[i],vm.myText[j])) {
                                    located = true;
                                    vm.myText[j].value = finalResult[i].value;
                                    vm.myText[j].pictos = finalResult[i].pictos;
                                    vm.myText[j].autofocus = false;
                                    vm.myText[j].words = 1;
                                    vm.myText[j].divStyle = null;
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
        }

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

        /**
         * Reads the image from the file system.
         * @param {picto} picto - The pictograph to be read
         */
        function readPicto(picto) {

            // Digest cycles are faster than read fs so we return empty picto to avoid multiple reads
            if (picto && !picto['base64'])
                picto['base64'] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8/58BAzAOZUEA5OUT9xiCXfgAAAAASUVORK5CYII=";

            if (picto)
                document.addEventListener('deviceready', readPictHandler, false);

            function readPictHandler() {
                var dirUrl = cordova.file.dataDirectory;
                var dirName = 'pictos/';
                $cordovaFile.readAsDataURL(dirUrl+dirName, picto['picto'])
                    .then(function(success){
                        picto['base64'] = success;
                    },function(){
                        picto['base64'] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8/58BAzAOZUEA5OUT9xiCXfgAAAAASUVORK5CYII=";
                    });


            }

        }

        /**
         * $scope.$apply() used to troubleshoot singleActionClick()
         * @param {word} word - The word whose pictograph must change.
         */
        function nextPicto(word) {
            word.pictInd = (word.pictInd+1)%word.pictos.length;
            $scope.$apply();
        }

        /**
         * If the word is empty, it will be deleted
         * @param {word} word - The word that must be checked.
         */
        function onKeyUp(event, word) {
            var separators = ['.',',',';',':','.',' '];
            var realValue = event.target.value;
            var modelValue = word.value;
            // If word is empty means you've deleted it's content so
            // the input field will be destroy. If the word has been
            // unbinded then you can rewrite it without destroy the
            // input.
            if (realValue.length==0) {
                console.log('KU-length-0',word.value);
                if (word.unbind && word.blocked) {
                    word.blocked = false;
                } else {
                    console.log('Delete',word.value);
                    $timeout(function() {
                        if (event.target.value.length==0) textAnalyzer.deleteWord(word, vm.myText);
                    },3)
                }
            }
            // New input field will be created when a separator is written
            // we do not have event.keyCode so i've thought a workaround.
            // If word.value.length > event.target.value.length means user
            // is writing so new word should be created.
            else if ( separators.indexOf(realValue.charAt(realValue.length-1)) >= 0 // Last written was a separator
            && realValue.length > modelValue.length) {
                if (word.pictos[0].picto) word.empty = true;
                if (realValue.lastIndexOf(' ')==realValue.length-1) {
                   if(document.getElementById(word.id)) document.getElementById(word.id).value=realValue.trim();
                }
                console.log('addEmpty',word.value);
                textAnalyzer.addEmptyWord(word,vm.myText);
            }

            else if (realValue.split(' ').length>modelValue.split(' ').length) {
                console.log('COMP',realValue,modelValue);
                var newWords = [];
                realValue.split(' ').forEach(function(w) {
                    newWords.push({
                        'autofocus': false,
                        'words': 1,
                        'divStyle': null,
                        'id': getId(),
                        'value': w,
                        'pictos': [emptyPicto],
                        'pictInd': 0
                    })
                });
                var ind = vm.myText.indexOf(word);
                vm.myText.splice.apply(vm.myText, [ind,1].concat(newWords));
                textAnalyzer.processEvent(vm.myText[ind], vm.myText)
                    .then(insertResults);
            }
        }


        /**
         * Reads a word by using text to speech
         * @param {word} word - The word to be read.
         */
        function readWord(word) {
            TTS.speak({
                text: word.value,
                locale: vm.conf.configuration.docLang.locale,
                rate: vm.conf.configuration.tts/10
            });
        }

        // Used in singleClickAction to manage double clicks
        var waitingForSecondClick = false;
        var executingDoubleClick = false;

        /**
         * Manages single/double click changin the image or reading the text
         * depending on the event.
         * @param {word} word - The word which has been clicked.
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
         * @param {word} word - the word which has been clicked
         * @param {Boolean} executingDoubleClick - True if doble click occurs during the timeout
         */
        function singleClickOnlyAction(word, executingDoubleClick) {
            if (executingDoubleClick) return;
            nextPicto(word)
        }

        /**
         * DoubleClick callback
         * @param {word} word - The word which has been double clicked
         */
        function doubleClickAction(word) {
            readWord(word);
        }

        /**
         * Concatenates the full text and reads it by using the text to speech.
         */
        function readText() {

            var text = '';
            for(var i=0; i<vm.myText.length; i++){
                text += vm.myText[i].value;
            }

            TTS.speak({
                text: text,
                locale: vm.conf.configuration.docLang.locale,
                rate: vm.conf.configuration.tts/10
            }, function() {
                TTS.speak('');
            }, function() {
                TTS.speak('');
            })
        }

        /**
         * Displays the options popup for a word.
         * @param {word} word - The selected word
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

        /**
         * Sends a document in its original .AWZ form to be able to open it
         * from any other Araword app.
         */
        function sendDocument() {
            console.log(textAnalyzer.docName);
            docsService.saveDoc(vm.myText,null,textAnalyzer.docName?textAnalyzer.docName:'document')
                .then(function(data) {
                    if (!data.target.error) {
                        resolveLocalFileSystemURL(data.target.localURL, function(entry) {
                            var nativePath = entry.toURL();
                            var title = $filter('translate')('send_awd');
                            var body = $filter('translate')('send_awd_c');
                            window.plugins.socialsharing.shareViaEmail(
                                title, // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
                                body,
                                null, // TO: must be null or an array
                                null, // CC: must be null or an array
                                null, // BCC: must be null or an array
                                [nativePath], // FILES: can be null, a string, or an array
                                function() {
                                    $cordovaFile.removeFile(cordova.file.externalDataDirectory,'document.awz');
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
                    var picto = {};

                    if(result[0]) {
                        var separator = result[0].lastIndexOf('/');
                        picto.oldPath = result[0].substr(0,separator);
                        picto.fileName = result[0].substr(separator+1);
                        var type = vm.selectedWord.pictos[vm.selectedWord.pictInd].type;
                        picto.type =  type;
                        picto.word = vm.selectedWord.value;

                        pictoService.addPicto(picto)
                            .then(function(newPicto) {
                                // It injects the image directly
                                $cordovaFile.readAsDataURL(pictoService.pictoPath, newPicto.filename)
                                    .then(function(data) {
                                        vm.selectedWord.pictos = [{
                                            'picto':picto.fileName,
                                            'type':picto.type,
                                            'base64':data
                                        }].concat(vm.selectedWord.pictos);
                                        vm.selectedWord.pictInd = 0;
                                    })
                            });

                    }
                    vm.optionsPopup.close();
                });
        }

        /**
         * Allows user to modify a text without modifying pictographs
         */
        function modifyText() {
            vm.selectedWord['unbind'] = true;
            vm.selectedWord['blocked'] = true;
            vm.optionsPopup.close();
            textAnalyzer.setCaret(vm.myText,vm.myText.indexOf(vm.selectedWord));
        }

        function getId() {
            // Math.random should be unique because of its seeding algorithm.
            // Convert it to base 36 (numbers + letters), and grab the first 9 characters
            // after the decimal.
            return '_' + Math.random().toString(36).substr(2, 9);
        }


    }
})();