'use strict';

angular
  .module('groupAssignerApp', [
    'ngSanitize',
    'ngRoute',
    'ngCookies',
    'ui.bootstrap'
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
          course: ['$http', '$route', 'apiURL', function($http, $route, apiURL){
            return $http.get(apiURL + '?action=getcourse&course_id=' + $route.current.params.courseId);
          }]
        }
      })
      .when('/matrix/:courseId', {
        templateUrl: 'views/matrix.html',
        controller: 'MatrixCtrl'
      })
      .when('/edit/:courseId/:round/:nbGroups?', {
        templateUrl: 'views/edit.html',
        controller: 'EditCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function($rootScope, user, $location, $cookies){
    $rootScope.logout = function(){
      user.logout();
    };
  
    $rootScope.$on('$routeChangeSuccess', function(event, currentRoute) {
      if(currentRoute.$$route.controller && currentRoute.params.courseId ){
        $rootScope.state = currentRoute.$$route.controller;
        $rootScope.course = {id:currentRoute.params.courseId, round:currentRoute.params.round};
      }else{
        $rootScope.state = '';
        $rootScope.course = {};
      }
    });
    $rootScope.$on('$routeChangeError', function() {
      $location.path('/');
    });
    
    if($cookies.PHPSESSID && $cookies.trylogin){
      user.login();
    }
  });
  
gapi.load('auth:client', function () {
  gapi.auth.init();
  angular.element(document).ready(function () {
    angular.bootstrap(document, ['groupAssignerApp']);
  });
});