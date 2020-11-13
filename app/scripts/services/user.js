'use strict';

angular.module('groupAssignerApp')
  .service('user', function User($q, $rootScope, config, apiURL, $http, $timeout) {

    /* jshint camelcase: false */
    var self = this;

    this.login = function(){
      self.requireAuth(true).then(function (user) {
        return self.authorize(user);
      });
    };

    this.logout = function(){
      gapi.auth2.getAuthInstance().signOut();
      $rootScope.user = '';
      $http.get(apiURL + '?action=logout')
      .success(function(data){
        self.courses = data;
      });
    };

    this.getCourses = function(){
      $http.get(apiURL + '?action=listcourses')
      .success(function(data){
        self.courses = data;
      });
    };

    this.authorize = function(user){
      var deferred = $q.defer();
      var userId = user.getBasicProfile().getId();
      $http.get(apiURL + '?action=login&user_id=' + userId + '&token=' + user.getAuthResponse(true).access_token)
          .success(function(data){
            deferred.resolve(data);
            $rootScope.user = user;
            self.courses = data;
          })
          .error(function(){
            //TODO could handle error responses display
            console.log('Rejected userlogin with id ' + userId);
            deferred.reject();
          });
      $timeout(function(){
        deferred.reject('timeout');
      }, 10000);
      return deferred.promise;
    };

    this.requireAuth = function () {
      var deferred = $q.defer();
      gapi.load('auth2', function() {
        gapi.auth2.init(config).then(function(auth2) {
          if(auth2.currentUser.get().isSignedIn()) {
            deferred.resolve(auth2.currentUser.get());
          } else {
            auth2.signIn(config).then(function(user){
              deferred.resolve(user);
            });
          }
        });
      });
      return deferred.promise;
    };
  });
