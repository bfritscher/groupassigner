'use strict';

angular.module('groupAssignerApp')
  .controller('CourseCtrl', function ($scope, course, $http, apiURL, $rootScope, $location, $window) {
    ga('send', 'pageview', $location.path());
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
    
    $scope.firstStudent = false;
    $scope.setActiveStudent = function(student){
      ga('send', 'pageview', $location.path() + '/highlight');
      if($scope.selectedStudent === student){
        $scope.selectedStudent = '';
        $scope.firstStudent = false;
      }else if($scope.selectedStudent2 === student){
        $scope.selectedStudent2 = '';
        $scope.firstStudent = true;
      }else if($scope.firstStudent){
        $scope.selectedStudent2 = student;
        $scope.firstStudent = false;
      }else{
        $scope.selectedStudent = student;
        $scope.firstStudent = true;
      }
    };
    
    $scope.assign = function(){
      ga('send', 'pageview', $location.path() + '/assignauto');
      $rootScope.loading = true;
      $http.post(apiURL + '?action=make&course_id=' + $scope.course.id + '&groups=' + $scope.groupCount,
      'students=' + $scope.course.students,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .success(function(data){
        updateRounds(data);
        var lastRound = data[data.length-1][0];
        $scope.roundResult = {round: lastRound, groups: $scope.rounds[lastRound]};
        $rootScope.loading = false;
      });
    };
        
    $scope.assignManual = function(){
      ga('send', 'pageview', $location.path() + '/assignmanual');
      $http.post(apiURL + '?action=updatestudents&course_id=' + $scope.course.id,
      'students=' + $scope.course.students,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .success(function(round){
        $location.path('/edit/' + $scope.course.id + '/' +  round + '/' + $scope.groupCount);
      });
    };
    
    $scope.deleteRound = function(round){
      ga('send', 'pageview', $location.path() + '/deleteround');
      $http.get(apiURL + '?action=deleteround&course_id=' + $scope.course.id + '&round=' + round);
      $scope.roundsOrder.splice($scope.roundsOrder.indexOf(round), 1);
    };
    
    $scope.deleteCourse = function(){
      ga('send', 'pageview', $location.path() + '/delete');
      if($window.confirm('Delete course ' + $scope.course.name + ' including all rounds and participants?')){
        $http.get(apiURL + '?action=deletecourse&course_id=' + $scope.course.id)
        .success(function(){
          $location.path('/');
        });
      }
      
    };
  });
