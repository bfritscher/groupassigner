'use strict';

angular.module('groupAssignerApp')
  .service('user', function User($q, $rootScope, config, apiURL, $http, $timeout) {

    /* jshint camelcase: false */
    var self = this;
    
    this.login = function(){
      self.requireAuth(true).then(function () {
        return self.authorize();
      });
    };
    
    this.logout = function(){
      gapi.auth.signOut();
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
     
    this.authorize = function(){
      var deferred = $q.defer();
      gapi.client.load('plus', 'v1', function() {
        var request = gapi.client.plus.people.get({userId:'me'});
        request.execute(function(result){
          //got info from google, now validate on our server
          $http.get(apiURL + '?action=login&user_id=' + result.id + '&token=' + gapi.auth.getToken().access_token)
          .success(function(data){
            deferred.resolve(data);
            $rootScope.user = result;
            self.courses = data;
          })
          .error(function(){
            //TODO could handle error responses display
            console.log('Rejected userlogin with id ' + result.id);
            deferred.reject();
          });
        });
      });
      $timeout(function(){
        deferred.reject('timeout');
      }, 10000);
      return deferred.promise;
    };
    
    this.requireAuth = function (immediateMode) {
      var token = gapi.auth.getToken();
      var now = Date.now() / 1000;
      if (token && ((token.expires_at - now) > (60))) {
        return $q.when(token);
      } else {
        var params = {
          'client_id': config.clientId,
          'scope': config.scopes,
          'immediate': immediateMode
        };
        var deferred = $q.defer();
        var doAuth = function doAuth(){
          gapi.auth.authorize(params, function (result) {
            if (result && !result.error) {
              deferred.resolve(result);
            } else {
              //try not immediate
              if(params.immediate){
                params.immediate = false;
                doAuth();
              }else{
                deferred.reject(result);
              }
            }
            $rootScope.$digest();
          });
        };
        doAuth();
        return deferred.promise;
      }
    };
  });
