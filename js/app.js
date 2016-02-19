'use strict'
var app = angular.module('Lip', ['ui.router', 'ngFileUpload'])
  .config(['$stateProvider', '$urlRouterProvider', MainRouter])
  .run(['$rootScope', '$state', runFunction])

function MainRouter($stateProvider, $urlRouterProvider) {

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

  $urlRouterProvider.otherwise('/')
}

function runFunction($rootScope, $state) {
  $rootScope.previousState;
  $rootScope.currentState;
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








