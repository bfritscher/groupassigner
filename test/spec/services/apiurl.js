'use strict';

describe('Service: apiURL', function () {

  // load the service's module
  beforeEach(module('groupAssignerApp'));

  // instantiate service
  var apiURL;
  beforeEach(inject(function (_apiURL_) {
    apiURL = _apiURL_;
  }));

  it('should do something', function () {
    expect(!!apiURL).toBe(true);
  });

});
