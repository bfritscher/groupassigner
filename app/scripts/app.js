'use strict';

angular
  .module('groupAssignerApp', [
    'ngSanitize',
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/course/:courseId', {
        templateUrl: 'views/course.html',
        controller: 'CourseCtrl',
        resolve: {
          course: function($http, $route, apiURL){
            return $http.get(apiURL + '?action=getcourse&course_id=' + $route.current.params.courseId);
          }
        }
      })
      .when('/matrix/:courseId', {
        templateUrl: 'views/matrix.html',
        controller: 'MatrixCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function($rootScope){
    $rootScope.$on('$routeChangeSuccess', function(event, currentRoute, previousRoute) {
      if(currentRoute.$$route.controller && currentRoute.params.courseId ){
        $rootScope.state = currentRoute.$$route.controller;
        $rootScope.course = {id:currentRoute.params.courseId};
      }else{
        $rootScope.state = '';
        $rootScope.course = {};
      }
    });
  });
