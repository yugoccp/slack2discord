const assert = require('assert');
const messageParser = require('../src/messageParser');

describe('splitLongText', function () {
  it('should split text into 3 chunks', function() {
    const result = messageParser.splitLongText('Lorem ipsum lorem ipsum', 10);
    assert.equal(result.length, 3);
  });

  it('should split text with newline into 3 chunks', function() {
    const result = messageParser.splitLongText('Lorem ipsum\n lorem\n ipsum', 10);
    assert.equal(result.length, 3);
  });
});
