'use strict';

angular.module('groupAssignerApp')
  .controller('CourseCtrl', function ($scope, course, $http, apiURL) {
    $scope.groupCount = 5;
    $scope.course = course.data[0];
    $http.get(apiURL + '?action=getgroups&course_id=' + $scope.course.id)
    .success(function(data){
      updateRounds(data);
    });
    
    function updateRounds(data){
      var round, group, student;
      $scope.rounds = {};
      $scope.roundsOrder = [];
      $scope.groupsOrder = {};
      for(var i=0;i<data.length;i++){
        round = data[i][0];
        group = data[i][1];
        student = data[i][2];
        if(!$scope.rounds.hasOwnProperty(round)){
          $scope.rounds[round] = {};
          $scope.roundsOrder.push(round);
          $scope.groupsOrder[round] = [];
        }
        if(!$scope.rounds[round].hasOwnProperty(group)){
          $scope.rounds[round][group] = [];
          $scope.groupsOrder[round].push(group);
        }
        $scope.rounds[round][group].push(student);
      }
    }
    
    $scope.setActiveStudent = function(student){
      if($scope.selectedStudent === student){
        $scope.selectedStudent = '';
      }else{
        $scope.selectedStudent = student;
      }
    };
    
    $scope.assign = function(){
      $http.post(apiURL + '?action=make&course_id=' + $scope.course.id + '&groups=' + $scope.groupCount,
      'students=' + $scope.course.students,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .success(function(data){
        updateRounds(data);
        var lastRound = data[data.length-1][0];
        $scope.roundResult = {round: lastRound, groups: $scope.rounds[lastRound]};
      });
    };
  });
