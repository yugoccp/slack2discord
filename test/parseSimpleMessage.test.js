const assert = require('assert');
const messageParser = require('../src/services/messageParser');
const simpleMessage = require('./rsc/simpleMessage');

describe('Parse Simple Message', function () {
  const result = messageParser.parseMessages([simpleMessage], {
    'userId': {
      name: 'UserName'
    }
  });

  const [message] = result;
  
  it('should parse to simple messages', function() {
    assert.equal(result.length, 1);
  });
  
  it('should start with datetime', function() {
    assert.equal(result[0].content.startsWith('`05/03/2018 08:08`'), true);
  });

  it('should replace user mentions', function() {
    assert.equal(message.content.includes('@UserName'), true);
  })

  it('should replace everybody mentions', function() {
    assert.equal(message.content.includes('@everybody'), true);
  })

  it('should replace channel mentions', function() {
    assert.equal(message.content.includes('@channelName'), true);
  })
});
