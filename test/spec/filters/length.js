'use strict';

describe('Filter: length', function () {

  // load the filter's module
  beforeEach(module('groupAssignerApp'));

  // initialize a new instance of the filter before each test
  var length;
  beforeEach(inject(function ($filter) {
    length = $filter('length');
  }));

  it('should return the input prefixed with "length filter:"', function () {
    var text = 'angularjs';
    expect(length(text)).toBe('length filter: ' + text);
  });

});
