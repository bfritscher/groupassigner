'use strict';

angular.module('groupAssignerApp')
  .controller('EditCtrl', function ($scope, apiURL, $http, $routeParams, $rootScope, $location) {
    ga('send', 'pageview', $location.path());
    $scope.numGroups = $routeParams.nbGroups;
    
    function updateGroups(data){
      $scope.groupsOrder = [];
      $scope.groups = {};
      var group, student;
      for(var i=0; i<data.length; i++){
        group = data[i][0];
        student = data[i][1];
        if(!$scope.groups.hasOwnProperty(group)){
          $scope.groups[group] = [];
          $scope.groupsOrder.push(group);
        }
        $scope.groups[group].push(student);
      }
      
      if($routeParams.nbGroups && $routeParams.nbGroups > $scope.groupsOrder.length){
        $scope.numGroups = $routeParams.nbGroups;
        updateGroupCount();
      }else{
        $scope.numGroups = $scope.groupsOrder.length;
      }
      $scope.getListForGroup(1);
      $rootScope.loading = false;
    }
    
    $http.get(apiURL + '?action=getround&course_id=' + $routeParams.courseId + '&round=' + $routeParams.round)
    .success(updateGroups)
    //TODO should be global with interceptor
    .error(function(){
      $location.path('/');
    });
    
    $scope.getListForGroup = function(group){
      ga('send', 'pageview', $location.path() + '/list/' + group);
      $scope.currentGroup = '';
      $scope.currentGroupTemp = group;
      $scope.list = '';
      $http.get(apiURL + '?action=getstudentsforgroup&course_id=' + $routeParams.courseId + '&round=' + $routeParams.round + '&group=' + group)
      .success(updateList);
    };
    
    function updateList(data){
      $scope.list = data;
      for(var i=0; i<data.length;i++){
        for(var j=0; j<data[i].length;j++){
          if(data[i][j][1]){
            data[i][j][1] = data[i][j][1].replace(/ /g, '\u00A0');
          }
        }
      }
      $scope.currentGroup = $scope.currentGroupTemp;
    }
  
    $scope.deleteGroup = function(group){
      ga('send', 'pageview', $location.path() + '/deletegroup/' + group);
      $scope.groupsOrder.splice($scope.groupsOrder.indexOf(group),1);
      $scope.numGroups--;
      $scope.currentGroup = '';
      $scope.list = '';
      $http.get(apiURL + '?action=deletegroup&course_id=' + $routeParams.courseId + '&round=' + $routeParams.round + '&group=' + group);
    };
    
    function updateGroupCount(){
      for(var i=0; i< $scope.numGroups; i++){
        if($scope.groupsOrder.indexOf(i+1) < 0){
          $scope.groupsOrder.splice(i,0,i+1);
          $scope.groups[i+1] = [];
        }
      }
    }
    
    $scope.addGroup = function(){
      ga('send', 'pageview', $location.path() + '/addgroup');
      $scope.numGroups++;
      updateGroupCount();
    };
    
    $scope.addStudentToGroup = function(student, group){
      ga('send', 'pageview', $location.path() + '/addstudent/' + group);
      $scope.groups[group].push(student);
      $scope.groups[group] = $scope.groups[group].sort();
      $scope.currentGroup = '';
      $http.post(apiURL + '?action=addstudenttogroup&course_id=' + $routeParams.courseId + '&round=' + $routeParams.round + '&group=' + group,
      'student=' + student,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .success(updateList);
    };
    
    $scope.removeStudentFromGroup = function(student, group){
      ga('send', 'pageview', $location.path() + '/removestudent/' + group);
      $scope.groups[group].splice($scope.groups[group].indexOf(student), 1);
      $scope.currentGroup = '';
      $scope.list = '';
      $http.post(apiURL + '?action=removestudentfromgroup&course_id=' + $routeParams.courseId + '&round=' + $routeParams.round + '&group=' + group,
      'student=' + student,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .success(updateList);
    };
    
    $scope.autoAssign = function(){
      ga('send', 'pageview', $location.path() + '/autoassign/');
      $rootScope.loading = true;
      //reset ng-repeat counters
      $scope.groups = {};
      $scope.groupsOrder = [];
      $http.get(apiURL + '?action=fill&course_id=' + $routeParams.courseId + '&round=' + $routeParams.round + '&groups=' + $scope.numGroups)
      .success(updateGroups);
    };
  });
