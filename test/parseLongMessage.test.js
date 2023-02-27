const assert = require('assert');
const messageParser = require('../src/services/messageParser');
const longMessage = require('./rsc/longMessage');

describe('Parse Long Message', function () {
  const result = messageParser.parseMessages([longMessage], {
    'userId': {
      name: 'UserName'
    }
  });
  const [msg1, msg2, msg3] = result;

  it('should split long message into 3 messages', function() {
    assert.equal(result.length, 3);
  });

  it('should start with datetime on first message', function() {
    assert.equal(msg1.content.startsWith('`05/03/2018 08:08`'), true);
  });

  it('should start without datetime on next messages', function() {
    assert.equal(msg2.content.startsWith('`05/03/2018 08:08`'), false);
    assert.equal(msg3.content.startsWith('`05/03/2018 08:08`'), false);
  });

  it('should replace user mentions', function() {
    assert.equal(msg1.content.includes('@UserName'), true);
  })

  it('should replace everybody mentions', function() {
    assert.equal(msg1.content.includes('@everybody'), true);
  })

  it('should replace channel mentions', function() {
    assert.equal(msg1.content.includes('@channelName'), true);
  })
});
