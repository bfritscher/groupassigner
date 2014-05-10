'use strict';

angular.module('groupAssignerApp')
  .controller('MatrixCtrl', function ($scope, $http, $routeParams, apiURL, $location) {
    ga('send', 'pageview', $location.path());
    $scope.headers = [];
    $scope.data = {};
    $http.get(apiURL + '?action=crosstab&course_id=' + $routeParams.courseId)
    .success(function(data){
      for(var i=0; i < data.length; i++){
        if($scope.headers.indexOf(data[i][0]) === -1){
          $scope.headers.push(data[i][0]);
          $scope.data[data[i][0]] = {};
        }
        if(data[i][0] === data[i][1]){
          $scope.data[data[i][0]][data[i][1]] = {count:'', when:''};
        }else{
          $scope.data[data[i][0]][data[i][1]] = {count:data[i][2], when:data[i][3].replace(/ /g, '\u00A0')};
        }
      }
    })
    //TODO should be global with interceptor
    .error(function(){
      $location.path('/');
    });
  });
