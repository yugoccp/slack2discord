const assert = require('assert');
const messageParser = require('../src/messageParser');
const embedMessage = require('./rsc/embeddedMessage');

describe('Parse Embeded Messages', function () {
  it('should parse embed message', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result.length, 1)
  });

  it('should match embed message url', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.url, "https://www.google.com/")
  });

  it('should match embed message title', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.title, "My Title")
  });

  it('should match embed message text', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.description, "My attachment text")
  });
});
