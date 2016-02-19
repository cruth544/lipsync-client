// const SERVER_URL = 'http://localhost:8888/'
const SERVER_URL = 'https://lipsyncwithus.herokuapp.com/'
const BUCKET = 'lipsyncwith.us-data'
app
  .factory('Video', ['$http', 'Upload', VideoService])

angular.module('AuthService', [])
  .factory('AuthToken', ['$window', AuthToken])
  .factory('Auth', ['$http', '$q', 'AuthToken', 'Video', Auth])
  .factory('AuthInterceptor',
    ['$q', '$location', 'AuthToken', AuthInterceptor])

function AuthToken($window) {
  var authToken = {}

  authToken.getToken = function () {
    return $window.localStorage.getItem('token')
  }
  authToken.setToken = function (token) {
    if (token) {
      $window.localStorage.setItem('token', token)
    } else {
      $window.localStorage.removeItem('token')
    }
  }

  return authToken
}

function Auth($http, $q, AuthToken) {
  var authFactory = {}

  authFactory.currentUser = null

  authFactory.login = function (email, password) {
    return $http.post(SERVER_URL + 'user/authenticate',
      {email: email,
        password: password
    })
    .success(function (data) {
      AuthToken.setToken(data.token)
      return data
    })
  }

  authFactory.logout = function () {
    AuthToken.setToken()
  }

  authFactory.isLoggedIn = function () {
    if (AuthToken.getToken()) {
      return true
    }
  }

  authFactory.getUser = function () {
    if (AuthToken.getToken()) {
      return $http.get(SERVER_URL + 'user/status', { cache: true })
    } else {
      return $q.reject({ message: 'User has no token' })
    }
  }

  return authFactory
}

function AuthInterceptor($q, $location, AuthToken) {
  var authInterceptor = {}

  authInterceptor.request = function (config) {
    var token = AuthToken.getToken()
    if (token) {
      config.headers['x-access-token'] = token
    }

    return config
  }

  authInterceptor.responseError = function (response) {
    if (response.status == 403) {
      AuthToken.setToken()
      $location.path('login')
    }
    return $q.reject(response)
  }

  return authInterceptor
}




function VideoService($http, Upload) {
  var service = {}

  Number.prototype.pad = function(size) {
      var s = String(this);
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
    }

  service.currentUser = null

  service.video = null
  service.songList = []
  service.getSongList = function (sync) {
    $http.get(SERVER_URL + 'song/list')
      .then(function (data) {
        service.songList = data.data.reverse()
        sync(service.songList)
        console.log(data)
      }).catch(function (err) {
        console.log(err)
      })
  }

  service.song = {
    _id      : null,
    name     : null,
    owner    : null,
    songUrl  : null,
    users    : null,
    snippets : null,
    songFile : null
  }
  service.syncSongWith = function (song) {
    for (var key in service.song) {
      service.song[key] = song[key]
    }
  }

  service.getSong = function (song) {
    console.log(song)
    var url = 'https://'+ BUCKET +'.s3.amazonaws.com/'+ song.songUrl
    service.syncSongWith(song)
    $http.get(SERVER_URL + 'snippets/' + song._id, {songId: song._id}).then(
      function (data) {
        console.log("Snippets: ", data)
        service.song.snippets = data.data
        document.getElementById('song-preview').src = url
      }, function (err) {
        console.log(err)
      })
    // $http.get(url).then(function (data) {
    //   service.songUrl = data.config.url
    //   document.getElementById('song-preview').src = data.config.url
    //   console.log('the song is: ')
    //   console.log(data.config)
    // }, function (err) {
    //   console.log("http.get: ", err)
    // })
  }

  service.upload = function (snippet, song) {
    var time = new Date()
    var name = time.getUTCFullYear() +'-'+ (time.getUTCMonth() + 1).pad(2) +'-'+ time.getUTCDate().pad(2) + '_'
    name += time.getUTCHours().pad(2) +':'+ time.getUTCMinutes().pad(2) +':'+ time.getUTCSeconds().pad(2)
    // name += '_' +

    console.log("OWNER: ", song)
    // upload
    Upload.upload({
      url: SERVER_URL + 'song',
      data: {video: snippet, audio: song, fileName: name, owner: song.owner, newSongName: song ? song.name : null}
    }).then(function (resp) {
      console.log('Success!');
    }, function (resp) {
      console.log('Error status: ' + resp.status);
    }, function (evt) {
      var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      console.log('progress: ' + progressPercentage + '% ' + evt);
    })
  }

  return service
}




