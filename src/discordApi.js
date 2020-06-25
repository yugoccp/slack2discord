const axios = require('axios');
const { botToken } = require('../config.json');

const discordClient = axios.create({
  baseURL: 'https://discord.com/api/v6/',
  headers: {'Authorization': `Bot ${botToken}`}
});

const getChannels = async (guildId) => {
  const resp = await discordClient.get(`/guilds/${guildId}/channels`);
  return resp.data;
}

const deleteChannel = async (channelId) => {
  await discordClient.delete(`/channels/${channelId}`);
}

const sendMessage = async (data, webhook) => {
  const { content, ...messageOptions } = data;
  return webhook.send(content, messageOptions);
}

const getOrCreateChannel = async (client, guild, channelName, parentChannel) => {
  const channel = client.channels.cache.find(ch => ch.name === channelName);
  if (!channel) {
    return await guild.channels.create(channelName, { type: 'text', parent: parentChannel });
  }
  return channel;
}

const getOrCreateWebhook = async (channel, webhookName) => {
  const webhooks = await channel.fetchWebhooks();
  const webhook = webhooks.find(wh => wh.name == webhookName);
  if (!webhook) {
    return await channel.createWebhook(webhookName);
  }
  return webhook;
}


module.exports = {
  getChannels,
  sendMessage,
  getOrCreateWebhook,
  getOrCreateChannel,
  deleteChannel,
}