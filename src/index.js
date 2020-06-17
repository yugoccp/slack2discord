const slackBackupReader = require('./slackBackupReader.js');
const discordApi = require('./discordApi.js');
const utils = require('./utils.js');
const { 
  guildId, 
  excludeChannels = [], 
  includeChannels = [], 
  mapChannels = {}
} = require('../config.json');

const IMPORT_WEBHOOK_NAME = 'slack2discord';


const app = async () => {
  const slackChannels = await slackBackupReader.getChannels();
  const slackChannelNames = slackChannels
    .map(ch => mapChannels[ch.name] || ch.name)
    .map(name => name.toLowerCase());

  const discordChannels = await discordApi.getOrCreateChannels({ channelNames: slackChannelNames, guildId });
  const discordChannelIds = discordChannels.map(ch => ch.id);
  
  const discordWebhooks = await discordApi.getOrCreateWebhooks({ channelIds: discordChannelIds, webhookName: IMPORT_WEBHOOK_NAME });
  const discordWebhooksByChannelId = discordWebhooks.reduce((acc, wh) => ({ ...acc, [wh.channel_id]: wh }), {});
  
  const files = await slackBackupReader.getMessagesFiles({ includeChannels, excludeChannels }); 
  const usersById = await slackBackupReader.getUsersById();
  const discordChannelByName = discordChannels.reduce((acc, ch) => ({ ...acc, [ch.name.toLowerCase()]: ch }), {});

  for (const file of files) {
    const msgs = (await slackBackupReader.getMessages(file))
      .map(msg => replaceMentions(msg, usersById))
      .map(msg => addUsername(msg, usersById))
      .map(addDateTime); 

    const fileChannel = file.channel;
    const targetChannel = mapChannels[fileChannel] || fileChannel;
    const channel = discordChannelByName[targetChannel.toLowerCase()];
    const webhook = discordWebhooksByChannelId[channel.id];

    let i = 0;
    while(i < msgs.length) {
      try {
        const resp = await discordApi.sendMessage({ data: msgs[i], webhook });
        if (resp.headers['x-ratelimit-remaining'] == 0) {
          await utils.delay(2000);
        }
        ++i;
      } catch (err) {
        if (err.response.status == 429) {
          const retryAfter = err.response.headers['retry-after']
          if (retryAfter) {
            console.log(`Retry after: ${retryAfter}ms`);
            await utils.delay(retryAfter);
          }
        } else {
          console.error(err.response.data.text);
          ++i;
        }
      }
    }
  }
}

const addDateTime = (message) => {
  const dateStr = utils.dateFormat(new Date(message.ts*1000));
  message.text = '`' + dateStr + '` ' + message.text;
  return message;
}

const addUsername = (message, usersById) => {
  message.username = findUsername(usersById, message.user);
  return message;
}

const replaceMentions = (message, usersById) => {
  message.text = message.text.replace(/<@\w+>/g, match => findUsername(usersById, match.substring(2, match.length - 1)));
  return message;
}

const findUsername = (usersById, userId) => {
  const user = usersById[userId];
  if (!user) {
    console.error(`User not found: ${userId}`);
    return userId;
  }
  return user.profile.display_name_normalized || user.profile.real_name_normalized || user.name || userId
}

app();