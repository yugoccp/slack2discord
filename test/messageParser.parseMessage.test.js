const assert = require('assert');
const messageParser = require('../src/messageParser');
const longMessage = require('./rsc/longMessage');
const simpleMessage = require('./rsc/simpleMessage');
const userMentionMessage = require('./rsc/userMentionMessage');
const channelMentionMessage = require('./rsc/channelMentionMessage');

describe('messageParser', function () {

  describe('#parse simple messages', function () {
    const result = messageParser.parseMessages([simpleMessage], {});
    it('should parse to simple messages', function() {
      assert.equal(result.length, 1);
    });
    it('should start with datetime', function() {
      assert.equal(result[0].content.startsWith('`05/03/2018 08:08`'), true);
    });
  });
  
  describe('#parse long messages', function () {
    const result = messageParser.parseMessages([longMessage], {});
    it('should split long message into 3 messages', function() {
      assert.equal(result.length, 3);
    });

    it('should start with datetime on first message', function() {
      assert.equal(result[0].content.startsWith('`05/03/2018 08:08`'), true);
    });

    it('should start without datetime on next messages', function() {
      assert.equal(result[1].content.startsWith('`05/03/2018 08:08`'), false);
      assert.equal(result[2].content.startsWith('`05/03/2018 08:08`'), false);
    });
  });

  describe('#replace user mentions messages', function () {
    it('should replace user mentions', function() {
      const [message] = messageParser.parseMessages([userMentionMessage], {
        'userId': {
          name: 'UserName'
        }
      });
      assert.equal(message.content.includes('@UserName'), true);
    })

    it('should replace everybody mentions', function() {
      const [message] = messageParser.parseMessages([userMentionMessage], {});
      assert.equal(message.content.includes('@everybody'), true);
    })
  });

  describe('#replace channel mentions messages', function () {
    it('should replace channel mentions', function() {
      const [message] = messageParser.parseMessages([channelMentionMessage], {});
      assert.equal(message.content.includes('@channelName'), true);
    })
  });

});
