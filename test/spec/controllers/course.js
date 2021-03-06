'use strict';

describe('Controller: CourseCtrl', function () {

  // load the controller's module
  beforeEach(module('groupAssignerApp'));

  var CourseCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CourseCtrl = $controller('CourseCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
