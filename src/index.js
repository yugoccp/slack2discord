const slackBackupReader = require('./slackBackupReader.js');
const discordApi = require('./discordApi.js');
const utils = require('./utils.js');
const { guildId, excludeChannels, includeChannels } = require('../config.json');

const IMPORT_WEBHOOK_NAME = 'slack2discord';


const app = async () => {
  const slackChannels = await slackBackupReader.getChannels();
  const slackChannelNames = slackChannels.map(ch => ch.name);

  const discordChannels = await discordApi.getOrCreateChannels({ channelNames: slackChannelNames, guildId });
  const discordChannelIds = discordChannels.map(ch => ch.id);
  const discordChannelByName = discordChannels.reduce((acc, ch) => ({ ...acc, [ch.name]: ch }), {});
  const discordWebhooks = await discordApi.getOrCreateWebhooks({ channelIds: discordChannelIds, webhookName: IMPORT_WEBHOOK_NAME });
  const discordWebhooksByChannelId = discordWebhooks.reduce((acc, wh) => ({ ...acc, [wh.channel_id]: wh }), {});
 
  const files = await slackBackupReader.getMessagesFiles({includeChannels, excludeChannels}); 
  const usersById = await slackBackupReader.getUsersById();

  for (const file of files) {
    const msgs = (await slackBackupReader.getMessages(file))
      .map(msg => replaceMentions(msg, usersById))
      .map(msg => addUsername(msg, usersById))
      .map(addDateTime); 

    const channel = discordChannelByName[file.channel];
    const webhook = discordWebhooksByChannelId[channel.id];

    for (const msg of msgs) {
      discordApi.sendMessage({ data: msg, webhook });
      await utils.delay(4000);
    }
  }
}

const addDateTime = (message) => {
  const dateStr = new Date(message.ts*1000).toLocaleString();
  message.text = '`' + dateStr + '`\n' +  message.text;
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