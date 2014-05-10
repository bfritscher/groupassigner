'use strict';

angular.module('groupAssignerApp')
  .filter('sum', function () {
    return function (obj) {
      if(angular.isObject(obj)){
        return Object.keys(obj).reduce(function(sum, key){
          return sum + obj[key].length;
        },0);
      }else{
        return obj;
      }
    };
  });
