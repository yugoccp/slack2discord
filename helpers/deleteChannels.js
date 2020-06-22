const discordApi = require('../src/discordApi.js');
const { guildId } = require('../config.json');

const deleteChannelNames = [];

const deleteChannels = async () => {

  const discordChannels = await discordApi.getChannels(guildId);
  const deleteDiscordChannels = discordChannels;

  if (deleteChannelNames.length > 0) {
    const deleteChannelNamesSet = new Set(deleteChannelNames);
    deleteDiscordChannels = discordChannels.filter(ch => !deleteChannelNamesSet(ch.name));
  }

  for (let i = 0; i< deleteDiscordChannels.length; ++i) {
    const ch = deleteDiscordChannels[i];
    try {
      await discordApi.deleteChannel(ch.id);
    } catch (err) {
      console.error(err);
    }
  }
}

deleteChannels();