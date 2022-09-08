const { Guild, Client, Channel, Webhook, ChannelType } = require('discord.js');

/**
 * Retrieve channels of the give `guildId`.
 * @param {Client} client 
 * @param {number} guildId 
 */
const getChannels = async (client, guildId) => {
  return await client.channels.cache.filter(ch => ch.guild.id == guildId)
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
 * @param {Guild} guild 
 * @param {string} channelName 
 * @param {Channel} parentChannel 
 */
const getOrCreateChannel = async (guild, channelName, parentChannel) => {
  const channels = await guild.channels.fetch();
  const channel = [...channels.values()].find(ch => ch.name == channelName)
  if (!channel) {
    return await guild.channels.create({name: channelName, type: ChannelType.GuildText, parent: parentChannel });
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
    return await channel.createWebhook({name: webhookName});
  }
  return webhook;
}


module.exports = {
  getChannels,
  sendMessage,
  getOrCreateWebhook,
  getOrCreateChannel
}