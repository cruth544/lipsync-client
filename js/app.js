'use strict'
var app = angular.module('Lip',
  ['ui.router', 'ngFileUpload', 'AuthService'])
  .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', MainRouter])
  .run(['$rootScope', '$state', '$location', 'Auth', runFunction])

function MainRouter($stateProvider, $urlRouterProvider, $httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor')

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'templates/song-list.html',
      params: null,
      controller: 'SongCtrl'
    })
    .state('watch', {
      url: '/watch',
      templateUrl: 'templates/record-view.html',
      params: null,
      controller: 'WatchCtrl'
    })
    .state('record', {
      url: '/record',
      templateUrl: 'templates/record-view.html',
      params: null,
      controller: 'CameraCtrl'
    })
    .state('friends', {
      url: '/friends',
      templateUrl: 'templates/friends-list.html',
      params: null,
      controller: 'FriendsCtrl'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login-modal.html',
      params: null,
      controller: 'LoginCtrl'
    })

  $urlRouterProvider.otherwise('/')
}

function runFunction($rootScope, $state, $location, Auth) {
  $rootScope.previousState;
  $rootScope.currentState;

  $rootScope.$on('$stateChangeStart', function () {
    if (!Auth.currentUser) {
      Auth.getUser().then(function (data) {
        Auth.currentUser = data.data._id
      })
    }
    // if (Auth.isLoggedIn()) return
    // $location.path('/login')
  })

  $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
      $rootScope.previousState = from.name;
      $rootScope.currentState = to.name;
      console.log('Previous state:'+$rootScope.previousState)
      console.log('Current state:'+$rootScope.currentState)
  })

  $rootScope.back = function () {
    var routing = {
      home: 'home',
      watch: 'home',
      record: 'home',
      friends: 'record',
    }
    var audio = document.getElementById('song-preview')
    if (audio) {
      audio.src = ''
    }
    $state.go(routing[$rootScope.currentState])
    // if ($rootScope.previousState) {
    //   $state.go($rootScope.previousState)
    // } else {
    //   $state.go('home')
    // }
  }
}








