'use strict';

angular.module('groupAssignerApp')
  .filter('length', function () {
    return function (obj) {
      return Object.keys(obj).length;
    };
  });
