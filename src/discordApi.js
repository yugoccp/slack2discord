const axios = require('axios');
const { WebhookClient } = require('discord.js');
const { botToken } = require('../config.json');

axios.defaults.baseURL = 'https://discord.com/api/v6/';
axios.defaults.headers.common['Authorization'] = `Bot ${botToken}`;

const getChannels = async (guildId) => {
  const resp = await axios.get(`/guilds/${guildId}/channels`);
  return resp.data;
}

const deleteChannel = async (channelId) => {
  await axios.delete(`/channels/${channelId}`);
}

const sendMessage = async (data, webhook) => {
  const webhookClient = new WebhookClient(webhook.id, webhook.token);
  return webhookClient.send(data.content, data);
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