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
    assert.equal(result[0].data.url, "https://www.discord.com/")
  });

  it('should match embed message title', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.title, "My Title")
  });

  it('should match embed message text', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.description, "My attachment text")
  });

  it('should match embed message footer text', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.footer.text, "My Footer")
  });

  it('should match embed message footer icon URL', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.footer.icon_url, "https://assets-global.website-files.com/6257adef93867e50d84d30e2/625e5fcef7ab80b8c1fe559e_Discord-Logo-Color.png")
  });

  it('should match embed message author name', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.author.name, "My Author")
  });

  it('should match embed message author icon URL', function() {
    const result = messageParser.getEmbeds(embedMessage);
    assert.equal(result[0].data.author.icon_url, "https://assets-global.website-files.com/6257adef93867e50d84d30e2/625e5fcef7ab80b8c1fe559e_Discord-Logo-Color.png")
  });
});
