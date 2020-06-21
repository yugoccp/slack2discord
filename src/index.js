const slackBackupReader = require('./slackBackupReader.js');
const discordApi = require('./discordApi.js');
const slackApi = require('./slackApi.js');
const utils = require('./utils.js');
const { 
  guildId, 
  mapChannels = {}
} = require('../config.json');

const IMPORT_WEBHOOK_NAME = 'slack2discord';

const app = async () => {

  const slackChannelNames = await slackBackupReader.getChannelNames();
  const discordChannelNames = slackChannelNames.map(ch => mapChannels[ch]);

  const discordChannels = await discordApi.getOrCreateChannels(discordChannelNames, guildId);
  const discordChannelIds = discordChannels.map(ch => ch.id);
  const discordChannelByName = discordChannels.reduce((acc, ch) => ({ ...acc, [ch.name.toLowerCase()]: ch }), {});
  
  const discordWebhooks = await discordApi.getOrCreateWebhooks(discordChannelIds, IMPORT_WEBHOOK_NAME);
  const discordWebhooksByChannelId = discordWebhooks.reduce((acc, wh) => ({ ...acc, [wh.channel_id]: wh }), {});
  
  const usersById = await slackBackupReader.getUsersById();

  const files = await slackBackupReader.getMessagesFiles(slackChannelNames); 

  for (const file of files) {
    const msgs = await slackBackupReader.getMessages(file.path)

    const formattedMsgs = msgs
      .map(msg => hadleMentions(msg, usersById))
      .map(msg => handleUsername(msg, usersById))
      .map(handleTimestamp)
      .map(handleAttachments)
      .map((msg, i, arr) => handleDateTime(msg, i > 0 ? arr[i - 1] : {}))
      .map(handleEmptyMessage)
      .map(handleAvatar)
      .map(handleLongMessage)
      .flatMap();

    const fileAttachments = await Promise.all(
      msgs
        .filter(msg => msg.files)
        .map(getFileAttachments)
    );
    const fileAttachmentByMessageId = fileAttachments.flatMap().groupBy('messageId');

    const fileChannel = file.channel;
    const targetChannel = mapChannels[fileChannel] || fileChannel;
    const channel = discordChannelByName[targetChannel.toLowerCase()];
    const webhook = discordWebhooksByChannelId[channel.id];

    let i = 0;
    while(i < formattedMsgs.length) {
      
      const msg = formattedMsgs[i];

      try {
        const resp = await discordApi.sendMessage(msg, webhook);
        if (resp.headers['x-ratelimit-remaining'] == 0) {
          await utils.delay(2000);
        }
        ++i;
      } catch (err) {
        if (err.response) {
          if (err.response.status == 429) {
            const retryAfter = err.response.headers['retry-after']
            if (retryAfter) {
              console.log(`Too many requests. Retry after: ${retryAfter}ms.`);
              await utils.delay(retryAfter);
            }
          } else {
            //console.error(`Error ${i}: ${file.path}`, err.response.data);
            console.error(`Error ${i}: ${file.path}`, err);
            ++i;
          }
        } else {
          console.error(err);
        }
        
      }

      try {
        const msgFileAttachments = fileAttachmentByMessageId[msg.client_msg_id];
        if (msgFileAttachments) {
          await Promise.all(
            msgFileAttachments
              .map(att => ({
                username: msg.username,
                file: att.file,
                name: att.name
              }))
              .map(data => discordApi.sendFileAttachment(data, webhook))
          );
          fileAttachmentByMessageId[msg.client_msg_id] = null;
        }
      } catch (err) {
        if (err.response) {
          console.error(`Error ${i}: ${file.path}`, err.response.data);
        } else {
          console.error(err);
        }
      }
    }
  }
}

const handleTimestamp = message => {
  message.ts = parseInt(message.ts);
  return message;
}

const handleAttachments = message => {
  if (message.attachments) {
    message.attachments.forEach(att => {
      att.ts = parseInt(message.ts);
      att.color = undefined;
      att.text = att.text && (att.text.substring(0, 2000) + '...');
    });
  }
  return message;
}

const handleEmptyMessage = message => {
  if (message.text.length == 0) {
    message.text = '.';
  }
  return message;
}

const handleAvatar = message => {
  if (message.user_profile) {
    message.avatar_url = message.user_profile.image_72.replace(/\\\//g, '/')
  }
  return message;
}

const getFileAttachments = async message => {
  const fileAttachments = message.files.map(file => 
    slackApi.getFileAttachment(file.url_private_download.replace(/\\\//g, '/'))
    .then(resp => ({
      messageId: message.client_msg_id,
      file: resp.data,
      name: file.name
    }))
    .catch(err => {
      console.error(`Error getting attachment:`, err);
    })
  )
  return await Promise.all(fileAttachments);
}

const handleLongMessage = message => {
  const maxLength = 2000;
  if (message.text.length > maxLength) {
    const textChunks = message.text.match(new RegExp('.{1,' + maxLength + '}', 'g'));
    return textChunks.map(tc => ({
      ...message,
      text: tc
    }));
  }

  return [message];
}

const handleDateTime = (message, previousMessage) => {
  if (message.username != previousMessage.username) {
    const dateStr = utils.dateFormat(new Date(message.ts*1000));
    message.text = '`' + dateStr + '`\n' + message.text;
  }
  return message;
}

const handleUsername = (message, usersById) => {
  message.username = findUsername(usersById, message.user);
  return message;
}

const hadleMentions = (message, usersById) => {
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