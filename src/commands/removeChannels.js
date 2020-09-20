const { Client } = require('discord.js');
const discordApi = require('../discordApi.js');

module.exports = async (channels, token, serverId) => {

  const client = new Client();  

  client.once('ready', async () => {
    const deleteChannelNamesSet = new Set(channels);
    const discordChannels = await discordApi.getChannels(client, serverId);
    const deleteDiscordChannels = discordChannels.filter(ch => deleteChannelNamesSet.has(ch.name));

    deleteDiscordChannels.forEach(async channel => {
      try {
        await channel.delete();
      } catch (err) {
        console.error(err);
      }
    });
  });

  await client.login(token);

}
