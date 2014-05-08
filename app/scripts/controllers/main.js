'use strict';

angular.module('groupAssignerApp')
  .controller('MainCtrl', function ($scope, $http, apiURL, $location) {
    $http.get(apiURL + '?action=listcourses')
    .success(function(data){
      $scope.courses = data;
    });
    
    $scope.create = function(){
      if($scope.newCourseName.length > 3){
        $http.post(apiURL + '?action=createcourse', 'name=' + $scope.newCourseName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
        .success(function(id){
          $location.path('/course/' + id);
        });
      }
    };
  });
