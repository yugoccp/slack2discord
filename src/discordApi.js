const axios = require('axios');
const { botToken } = require('../config.json');
const { Guild, Client, Channel, Webhook } = require('discord.js');

/**
 * Retrieve channels of the give `guildId`.
 * @param {Client} client 
 * @param {number} guildId 
 */
const getChannels = async (client, guildId) => {
  const resp = await client.get(`/guilds/${guildId}/channels`);
  return resp.data;
}

/**
 * Delete channel with the given `channelId`.
 * @param {Client} client
 * @param {number} channelId 
 */
const deleteChannel = async (client, channelId) => {
  await client.delete(`/channels/${channelId}`);
}

/**
 * Send message to the webhook.
 * @param {*} data 
 * @param {Webhook} webhook 
 */
const sendMessage = async (data, webhook) => {
  const { content, ...messageOptions } = data;
  return webhook.send(content, messageOptions);
}

/**
 * Retrieve channel with `channelName` from Discord. If no channel with given name exists, create it and retrieve.
 * @param {Client} client 
 * @param {Guild} guild 
 * @param {string} channelName 
 * @param {Channel} parentChannel 
 */
const getOrCreateChannel = async (client, guild, channelName, parentChannel) => {
  const channel = client.channels.cache.find(ch => ch.name === channelName);
  if (!channel) {
    return await guild.channels.create(channelName, { type: 'text', parent: parentChannel });
  }
  return channel;
}

/**
 * Retrieve webhook with `webhookName` from Discord. If no webhook with given name exists, create and retrieve.
 * @param {Channel} channel 
 * @param {string} webhookName 
 */
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