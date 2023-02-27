const assert = require('assert');
const optionsParser = require('../src/services/optionsParser');

describe('Parse Command Options', function () {
  it('should parse config options', async function() {
    const result = await optionsParser.getOptions({config: "./test/rsc/testConfig.json"});
    assert.equal(result.token, "mybottoken123");
    assert.equal(result.guildId, "myguildid123");
    assert.equal(result.backupPath, "my/backup/path");
    assert.equal(result.parentChannel, "My Parent Channel");
    assert.deepEqual(result.includeChannels, ["channel1", "channel2"]);
    assert.deepEqual(result.excludeChannels, ["channel3", "channel4"]);
  });

  it('should prioritize params options', async function() {
    const result = await optionsParser.getOptions({
      config: "./test/rsc/testConfig.json", 
      token: "param-botToken" ,
      guildId: "param-guildId" ,
      backupPath: "param-backupPath" ,
      parentChannel: "param-parentChannel" ,
      includeChannels: ["paramChannel1", "paramChannel2"],
      excludeChannels: ["paramChannel3", "paramChannel4"]
    });
    
    assert.equal(result.token, "param-botToken");
    assert.equal(result.guildId, "param-guildId");
    assert.equal(result.backupPath, "param-backupPath");
    assert.equal(result.parentChannel, "param-parentChannel");
    assert.deepEqual(result.includeChannels, ["paramChannel1", "paramChannel2"]);
    assert.deepEqual(result.excludeChannels, ["paramChannel3", "paramChannel4"]);
  });
})