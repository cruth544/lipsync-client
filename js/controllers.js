app
.controller('LoginCtrl',
  ['$scope', '$http', '$state', 'Auth',
  function ($scope, $http, $state, Auth) {
    Auth.logout()
    $scope.signup = true
    $scope.userLogin = function (email, password) {
      Auth.login(email, password).then(function (data) {
        console.log(data)
        if (data.data.success) {
          $state.go('home')
        } else {
          $scope.loginError = data.data.message
        }
      }, function (err) {
        console.log("Login Error: ", err)
      })
    }

    $scope.userSignup = function (email, username, password) {
      if (!email || !username || !password) {
        return $scope.loginError = "Please complete all fields"
      }

      $http.post(SERVER_URL + 'user/signup',
        {email: email,
          username: username,
          password: password
      })
      .success(function (data) {
        console.log(data)
        if (data.success) {
          Auth.login(email, password).then(function (data) {
            if (data.data.success) {
              $state.go('home')
            }
          }, function (err) {
            console.log("Signup Error: ", err)
          })
        }
        return data
      })
    }
  }])
.controller('SongCtrl',
  ['$scope', '$state', '$stateParams', '$rootScope', 'Video', 'Auth',
  function ($scope, $state, $stateParams, $rootScope, Video, Auth) {

    $scope.back = $rootScope.back
    $scope.variable = "hello"
    $scope.songList = Video.songList
    $scope.songSelect = function (song) {
      song.owner = Auth.currentUser
      Video.getSong(song)
      $state.go('watch')
    }
    $scope.addSong = function (song) {
      song = song.files[0]
      console.log("Song: ", song)
      Video.song.name = song.name
      Video.song.songUrl = window.URL.createObjectURL(song)
      Video.song.songFile = song
      Video.song.owner = Auth.currentUser
      $state.go('record')
    }
    Video.getSongList(function (songList) {
      $scope.songList = songList
    })
}])
.controller('FriendsCtrl',
  ['$scope', '$http', '$state', '$stateParams', '$rootScope', 'Video',
  function($scope, $http, $state, $stateParams, $rootScope, Video){
    $scope.back = $rootScope.back
    if (!Video.video) return $scope.back()
    console.log("Service: ", Video.video)
    Video.upload(Video.video, Video.song)
    Video.getSong(Video.song)
    $state.go('watch')
}])
.controller('WatchCtrl',
  ['$scope', '$state', '$stateParams', '$rootScope', 'Video',
  function ($scope, $state, $stateParams, $rootScope, Video) {

///////////////////////////////INIT SCOPE///////////////////////////////
    $scope.back = function () {
      if (window.stream) {
        var streams = window.stream.getTracks()
        if (streams.length > 0) {
          for (var i = 0; i < streams.length; i++) {
            streams[i].stop()
          }
        }
      }
      $rootScope.back()
    }
    if (!Video.song.songUrl) return $scope.back()

////////////////////////////INIT VARIABLES//////////////////////////////
    var backButton    = document.getElementById('back-button')
    var recordButton  = document.getElementById('camera-button')
    var nextButton    = document.getElementById('next-button')
    recordButton.style.display = 'none'
    nextButton.style.display = 'inline'


    var playingIndex = 0
    var loaded = false

    var videoPreview = document.getElementById('camera-preview')
    var songPreview = document.getElementById('song-preview')
    songPreview.removeAttribute("controls")

////////////////////////////////FUNCTIONS///////////////////////////////

    function nextSnippet() {
      playingIndex++
      if (playingIndex >= Video.song.snippets.length) return $state.go('record')
      changeVideoSourceTo(Video.song.snippets[playingIndex])
    }
    function changeVideoSourceTo(snippet) {
      var bucket = 'lipsyncwith.us-data'
      var url = 'https://'+ bucket +'.s3.amazonaws.com/'+ snippet.videoUrl
      console.log(snippet.startTime)
      songPreview.currentTime = snippet.startTime
      if (!songPreview.paused) songPreview.pause()
      videoPreview.src = url
      videoPreview.play()
    }

    $scope.next = function () {
      nextSnippet()
    }

///////////////////////////////START////////////////////////////////////
    songPreview.addEventListener("canplaythrough", function (event) {
      if (!loaded) {
        loaded = true
        changeVideoSourceTo(Video.song.snippets[0])
        console.log(Video.song.snippets)
      }
    })

    videoPreview.addEventListener("playing", function (event) {
      songPreview.play()
    })

    videoPreview.addEventListener("ended", function (event) {
      nextSnippet()
    })

}])
.controller('CameraCtrl',
  ['$scope', '$state', '$stateParams', '$rootScope', 'Video',
  function($scope, $state, $stateParams, $rootScope, Video){

///////////////////////////////INIT SCOPE///////////////////////////////
    $scope.back = function () {
      if (window.stream) {
        var streams = window.stream.getTracks()
        if (streams.length > 0) {
          for (var i = 0; i < streams.length; i++) {
            streams[i].stop()
          }
        }
      }
      $rootScope.back()
    }
    if (!Video.song.songUrl) return $scope.back()
    // Video.getSong(function (song) {
    //   $scope.song = song
    // })

////////////////////////////INIT VARIABLES//////////////////////////////
    var backButton    = document.getElementById('back-button')
    var cancelButton  = document.getElementById('cancel-button')
    var recordButton  = document.getElementById('camera-button')
    var nextButton    = document.getElementById('next-button')

    var recording = false
    var songReady = false
    var windowSize = {
      height: document.body.clientHeight || window.innerHeight,
      width: document.body.clientWidth || window.innerWidth
    }
    var cameraPreview = document.getElementById('camera-preview')
    var videoOptions = {
      audio: false,
      video: {
        width: {ideal: windowSize.width, max: 1080},
        height: {ideal: windowSize.height, max: 1920},
        facingMode: 'user'
      }
    }
    var songPreview = document.getElementById('song-preview')
    songPreview.setAttribute('controls', 'controls')
    songPreview.addEventListener("canplaythrough", function(event){
      songReady = true
    })
    songPreview.addEventListener('seeked', function (event) {
      if (recording) {
        $scope.cancel()
      }
    })

    if (Video.song) {
      var bucket = 'lipsyncwith.us-data'
      var url = 'https://'+ bucket +'.s3.amazonaws.com/'+ Video.song.songUrl
      if (Video.song.songFile) {
        url = window.URL.createObjectURL(Video.song.songFile);
      }
      songPreview.src = url
      songPreview.load()
      if (Video.song.snippets) {
        songPreview.currentTime = Video.song.snippets[Video.song.snippets.length - 1].endTime
      }
    }


    // used camera variables
    var mediaRecorder, recordedBlobs, recordTimer, songRepeat

////////////////////////////MEDIA FUNCTIONS/////////////////////////////

    function successCallback(stream) {
      console.log('getUserMedia() got stream: ', stream);
      window.stream = stream;
      if (window.URL) {
        cameraPreview.src = window.URL.createObjectURL(stream);
      } else {
        gumVideo.src = stream;
      }
    }
    function errorCallback(error) {
      console.log('navigator.getUserMedia error: ', error);
    }
    function handleSourceOpen(event) {
      // console.log('MediaSource opened');
      sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
      // console.log('Source buffer: ', sourceBuffer);
    }

    function handleDataAvailable(event) {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    }

    function handleStop(event) {
      console.log('Recorder stopped: ', event);
    }

    function play() {
      var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'})
      songPreview.currentTime = songPreview.startTime
      cameraPreview.src = window.URL.createObjectURL(superBuffer)
      songPreview.play()
      recordButton.style.display = 'none'
      nextButton.style.display = 'inline';
      (function loopAudio() {
        if (songPreview.currentTime >= songPreview.endTime) {
          songPreview.currentTime = songPreview.startTime
          cameraPreview.play()
        }
        songRepeat = window.requestAnimationFrame(loopAudio)
      })()
      // save(true)
    }
    // if i need to download
    function save(downloadToDisk) {
      console.log('saving...')
      window.cancelAnimationFrame(songRepeat)
      var blob = new Blob(recordedBlobs, {type: 'video/webm'})
      if (!downloadToDisk) {
        Video.video = {
          blob: blob,
          audio: {
            startTime: songPreview.startTime,
            endTime: songPreview.endTime
          }
        }
      } else {
        var url = window.URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'test.webm'
        document.body.appendChild(a)
        a.click()
        setTimeout(function() {
          document.body.removeChid(a)
          window.URL.revokeObjectURL(url)
        }, 100)
      }
    }

////////////////////////////RECORD FUNCTIONS////////////////////////////
    $scope.toggleRecording = function() {
      if (!recording) {
        if (songReady) $scope.startRecording()
      } else {
        $scope.stopRecording()
      }
    }

    $scope.cancel = function () {
      if (recording) {
        $scope.stopRecording(true)
      }
      window.cancelAnimationFrame(songRepeat)
      console.log("The song is: ", songPreview.paused)
      if (!songPreview.paused) songPreview.pause()
      songPreview.currentTime = songPreview.startTime
      backButton.style.display = 'block'
      recordButton.style.display = 'block'
      cancelButton.style.display = 'none'
      nextButton.style.display = 'none'
      if (window.URL) {
        cameraPreview.src = window.URL.createObjectURL(window.stream);
      } else {
        gumVideo.src = window.stream;
      }
    }

    $scope.startRecording = function() {
      var recordLength = 15500
      recording = true
      var options = {mimeType: 'video/webm'}
      backButton.style.display = 'none'
      cancelButton.style.display = 'block'
      recordedBlobs = []
      try {
        mediaRecorder = new MediaRecorder(window.stream, options);
        recordTimer = setTimeout($scope.stopRecording, recordLength)
      } catch (e0) {
        console.log('Unable to create MediaRecorder with options Object: ', e0);
        try {
          options = {mimeType: 'video/webm,codecs=vp9'};
          mediaRecorder = new MediaRecorder(window.stream, options);
          recordTimer = setTimeout($scope.stopRecording, recordLength)
        } catch (e1) {
          console.log('Unable to create MediaRecorder with options Object: ', e1);
          try {
            options = 'video/vp8'; // Chrome 47
            mediaRecorder = new MediaRecorder(window.stream, options);
            recordTimer = setTimeout($scope.stopRecording, recordLength)
          } catch (e2) {
            alert('MediaRecorder is not supported by this browser.\n\n' +
                'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
            console.error('Exception while creating MediaRecorder:', e2);
            return;
          }
        }
      }
      // console.log('Created MediaRecorder', mediaRecorder, 'with options', options)
      mediaRecorder.onstop = handleStop;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start(10); // collect 10ms of data
      songPreview.startTime = songPreview.currentTime
      if (songPreview.paused) {
        songPreview.play()
      }
      // console.log('MediaRecorder started', mediaRecorder);
    }

    $scope.stopRecording = function (canceled) {
      clearTimeout(recordTimer)
      window.cancelAnimationFrame(songRepeat)
      if (recording) {
        mediaRecorder.stop();
        songPreview.pause()
        songPreview.endTime = songPreview.currentTime
        recording = false
        console.log('Recorded Blobs: ', recordedBlobs);
        if (!canceled) play()
      }
    }

    $scope.next = function () {
      save()
      // Video.getSong(Video.song)
      $state.go('friends')
    }
/////////////////////////////START CAMERA///////////////////////////////

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

    navigator.getUserMedia(videoOptions, successCallback, errorCallback)
}])



















