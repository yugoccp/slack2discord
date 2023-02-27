const assert = require('assert');
const utils = require('../src/utils/utils');

describe('Split Long Text', function () {
  it('should split text into 3 chunks', function() {
    const result = utils.splitText('Lorem ipsum lorem ipsum', 10);
    assert.equal(result.length, 3);
  });

  it('should split text with newline into 3 chunks', function() {
    const result = utils.splitText('Lorem ipsum\n lorem\n ipsum', 10);
    assert.equal(result.length, 3);
  });
});
