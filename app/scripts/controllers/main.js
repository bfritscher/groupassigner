'use strict';

angular.module('groupAssignerApp')
  .controller('MainCtrl', function ($scope, $http, apiURL, $location, user) {
    ga('send', 'pageview', $location.path());
    
    $scope.model = user;
    user.getCourses();
    
    $scope.create = function(){
      if($scope.newCourseName.length > 3){
        $http.post(apiURL + '?action=createcourse', 'name=' + $scope.newCourseName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
        .success(function(id){
          $location.path('/course/' + id);
        });
      }
    };
    
    $scope.login = function(){
      user.login();
    };
  });
