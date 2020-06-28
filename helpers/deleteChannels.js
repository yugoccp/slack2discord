const discordApi = require('../src/discordApi.js');
const { guildId } = require('../config.json');

const deleteChannelNames = ["general-slack"];

const deleteChannels = async (client) => {

  const deleteChannelNamesSet = new Set(deleteChannelNames);
  const discordChannels = await discordApi.getChannels(client, guildId);
  const deleteDiscordChannels = discordChannels.filter(ch => deleteChannelNamesSet.has(ch.name));

  for (let i = 0; i< deleteDiscordChannels.length; ++i) {
    const ch = deleteDiscordChannels[i];
    try {
      await discordApi.deleteChannel(client, ch.id);
    } catch (err) {
      console.error(err);
    }
  }
}

const app = async () => {
  
  const client = new Client();  

  client.once('ready', async () => {
    await deleteChannels(client);
  });

  await client.login(botToken);
}