const axios = require('axios');
const { botToken } = require('../config.json');

const DISCORD_PARENT_CHANNEL = 'Text Channels';

axios.defaults.baseURL = 'https://discord.com/api/v6/';
axios.defaults.headers.post['Content-Type'] = 'application/json';
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
  try {
    const resp = await axios.post(`/guilds/${guildId}/channels`, {
      "type":0,
      "name": name,
      "parent_id": parentId
    });
    return resp.data;
  } catch (err) {
    console.error(err);
  }
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
  try {
    await axios.post(`/webhooks/${webhook.id}/${webhook.token}/slack`, data);
  } catch (err) {
    console.error(err);
  }
}


const getOrCreateChannels = async ({ channelNames, guildId }) => {
  const currentChannels = await getChannels({ guildId });
  const currentChannelsByName = currentChannels.reduce((acc, ch) => ({ ...acc, [ch.name]: ch }), {});
  const parentChannel = currentChannelsByName[DISCORD_PARENT_CHANNEL] || {};
  const createdChannels = await createChannels({ 
    channelNames: channelNames.filter(name => !currentChannelsByName[name]),
    parentId: parentChannel.id,
    guildId
  });

  const channelNamesSet = new Set(channelNames);
  return [...createdChannels, ...currentChannels].filter(ch => channelNamesSet.has(ch.name));
}

const getOrCreateWebhooks = async ({ channelIds, webhookName }) => {
  const currentWebhooks = await getChannelsWebhook({ 
    channelIds, 
    webhookName 
  });
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
  getOrCreateChannels
}