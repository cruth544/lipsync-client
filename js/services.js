app
  .factory('Video', ['$http', 'Upload', VideoService])
  .factory('Session', SessionService)

function VideoService($http, Upload) {
  // var serverURL = 'http://localhost:8888/'
  var serverURL = 'https://lipsyncwithus.herokuapp.com/'

  Number.prototype.pad = function(size) {
      var s = String(this);
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
    }

  var bucket = 'lipsyncwith.us-data'

  var service = {}

  service.video = null
  service.songList = []
  service.getSongList = function (sync) {
    $http.get(serverURL + 'song/list')
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
    var url = 'https://'+ bucket +'.s3.amazonaws.com/'+ song.songUrl
    service.syncSongWith(song)
    $http.get(serverURL + 'snippets/' + song._id, {songId: song._id}).then(
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

  service.friendsList

  service.upload = function (snippet, song) {
    var time = new Date()
    var name = time.getUTCFullYear() +'-'+ (time.getUTCMonth() + 1).pad(2) +'-'+ time.getUTCDate().pad(2) + '_'
    name += time.getUTCHours().pad(2) +':'+ time.getUTCMinutes().pad(2) +':'+ time.getUTCSeconds().pad(2)
    //name += '_' + User.name
    // return console.log(snippet, song)

    // upload
    Upload.upload({
      url: serverURL + 'song',
      data: {video: snippet, audio: song, fileName: name, owner: 'The Maker', newSongName: song ? song.name : null}
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

function SessionService() {
  var service = {}


  return service
}



