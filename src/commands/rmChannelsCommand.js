const assert = require('assert').strict;
const removeChannels = require('../actions/removeChannels');

module.exports = async ({channels, token, serverId}) => {

    assert.ok(channels, 'Please provide a channel list to be removed');

    try {
      
      const channelList = channels.split(',');

      removeChannels(channelList, token, serverId);

    } catch (e) {
      console.error(`Couldn't parse channels names. Please make sure to use comma ',' separated string`);
    }
  }