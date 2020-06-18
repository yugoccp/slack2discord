const axios = require('axios');
const { WebhookClient, MessageAttachment } = require('discord.js');
const { botToken, parentChannel } = require('../config.json');


axios.defaults.baseURL = 'https://discord.com/api/v6/';
axios.defaults.headers.common['Authorization'] = `Bot ${botToken}`;


const createWebhook = async ({ channelId, name }) => {
  const resp = await axios.post(`/channels/${channelId}/webhooks`, {
    "name": name,
  });
  return resp.data;
}

const getWebhooks = async ({channelId}) => {
  const resp = await axios.get(`/channels/${channelId}/webhooks`);
  return resp.data;
}

const getChannels = async ({ guildId }) => {
  const resp = await axios.get(`/guilds/${guildId}/channels`);
  return resp.data;
}

const createChannel = async ({ name, guildId, parentId }) => {
    const resp = await axios.post(`/guilds/${guildId}/channels`, {
      "type":0,
      "name": name,
      "parent_id": parentId
    });
    return resp.data;
}

const createChannels = async ({ channelNames, guildId, parentId }) => {
  return await Promise.all(
    channelNames.map(name => createChannel({ 
      name, 
      parentId,
      guildId 
    })
  ));
}

const getChannelsWebhook = async ({ channelIds, webhookName }) => {
  const channelsWebhooks = await Promise.all(
    channelIds.map(channelId => 
      getWebhooks({ channelId })
      .then(resp => resp.find(wh => wh.name === webhookName))
  ));

  return channelsWebhooks.filter(wh => wh);
}

const createChannelsWebhook = async ({ channelIds, webhookName }) => {
  return await Promise.all(
    channelIds.map(channelId => createWebhook({ 
      channelId: channelId, 
      name: webhookName
    })
  ));
}

const sendMessage = async ({ data, webhook }) => {
  return await axios.post(`/webhooks/${webhook.id}/${webhook.token}/slack`, data);
}

const sendAttachment = async ({ data, webhook }) => {
  const file = Buffer.from(data.file);
  const attachment = new MessageAttachment(file, data.name);
  const webhookClient = new WebhookClient(webhook.id, webhook.token);
  await webhookClient.send(data.name, {
    username: data.username,
    files: [attachment]
  })
}

const getOrCreateChannels = async ({ channelNames, guildId }) => {
  const currentChannels = await getChannels({ guildId });
  const currentChannelsByName = currentChannels.reduce((acc, ch) => ({ ...acc, [ch.name]: ch }), {});
  const parentChannelObj = parentChannel ? currentChannelsByName[parentChannel] || {} : {};
  const createdChannels = await createChannels({ 
    channelNames: channelNames.filter(name => !currentChannelsByName[name]),
    parentId: parentChannelObj.id,
    guildId
  });

  const channelNamesSet = new Set(channelNames);
  return [...createdChannels, ...currentChannels].filter(ch => ch && channelNamesSet.has(ch.name));
}

const getOrCreateWebhooks = async ({ channelIds, webhookName }) => {
  const currentWebhooks = await getChannelsWebhook({ channelIds, webhookName });
  const currentWebhooksByChannelId = currentWebhooks.reduce((acc, wh) => ({ ...acc, [wh.channel_id]: wh }), {});
  const createdWebhooks = await createChannelsWebhook({ 
    channelIds: channelIds.filter(chId => !currentWebhooksByChannelId[chId]), 
    webhookName: webhookName 
  });

  return [...currentWebhooks, ...createdWebhooks];
}


module.exports = {
  getWebhooks,
  createWebhook,
  getChannels,
  createChannel,
  sendMessage,
  createChannelsWebhook,
  getChannelsWebhook,
  createChannels,
  getOrCreateWebhooks,
  getOrCreateChannels,
  sendAttachment
}